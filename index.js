let puppeteer = require('puppeteer-extra');
let StealthPlugin = require('puppeteer-extra-plugin-stealth')
let Discord = require('discord.js');
let fs = require('fs');
let fetch = require('node-fetch')
let config = require('./config');

puppeteer.use(StealthPlugin());

let client = new Discord.Client({
	intents: ["GUILDS", "GUILD_MESSAGE_TYPING", "GUILD_MESSAGES", "GUILD_WEBHOOKS", "GUILD_MEMBERS"]
});

let contextArr = [];
let pagesArr = [];
let pageSetIntervals = [];

console.log('\x1b[32m', 'Keydrop Autocode V4')
console.log('\x1b[31m', 'If you see this but the app keeps crashing, refresh your cookies and check if your token is valid.')
console.log('\x1b[31m', 'If the console dosent say account loaded it means your missing cookie file(s).')
console.log('\x1b[37m', 'Check out our github wiki for the FAQ')
async function run() {
	let browser = await puppeteer.launch({
		args: ['--no-sandbox'],
		headless: config.headless,
		executablePath: config.chromePath
	});

	fs.readdirSync('./cookies').filter(filename => filename.endsWith('.json')).forEach(async filename => {
		let context = await browser.createIncognitoBrowserContext();
		let page = await context.newPage();
		contextArr.push(context);
		pagesArr.push(page);
		await page.setCookie(...require(`./cookies/${filename}`));
		console.log(`Account ${filename} loaded`);

		await page.goto('https://key-drop.com/en/');

		pageSetIntervals.push(setInterval(claimDaily, 13*60*60*1000, context));		// try to claim daily every 13 hours
		await claimDaily(context);
	})

	let redeemer = new RedeemManager(pagesArr, false);		// Checking is disabled as keydrop codes are pre-checked

	client.once('ready' , c => {
		console.log(`[Discord] Logged in as ${c.user.tag} (${client.user.id})`);
	})
	
	client.on('messageCreate', async message => {
		let code = message.getCode();
		if(code != false) {
			console.log(`[Discord] Recieved new code: ${code}`);
			redeemer.redeem(code);
		}
	})

	client.login(config.discord_token);

	// await browser.close();
}

const wait = ms => {
	return new Promise((resolve, reject) => {
		setTimeout(() => resolve(), ms);
	})
}

const erroredWait = (ms, maxErr) => {
	return wait(Math.floor(ms + (((Math.random() - 0.5) * 2) * maxErr)));
}

// CAUTION: Do not call directly, only to be evaluated on a page
const findRecaptchaClients = () => {
	// eslint-disable-next-line camelcase
	if (typeof (___grecaptcha_cfg) !== 'undefined') {
		// eslint-disable-next-line camelcase, no-undef
		return Object.entries(___grecaptcha_cfg.clients).map(([cid, client]) => {
			const data = { id: cid, version: cid >= 10000 ? 'V3' : 'V2' };
			const objects = Object.entries(client).filter(([_, value]) => value && typeof value === 'object');

			objects.forEach(([toplevelKey, toplevel]) => {
				const found = Object.entries(toplevel).find(([_, value]) => (
					value && typeof value === 'object' && 'sitekey' in value && 'size' in value
				));

				if (typeof toplevel === 'object' && toplevel instanceof HTMLElement && toplevel['tagName'] === 'DIV') {
					data.pageurl = toplevel.baseURI;
				}

				if (found) {
					const [sublevelKey, sublevel] = found;

					data.sitekey = sublevel.sitekey;
					const callbackKey = data.version === 'V2' ? 'callback' : 'promise-callback';
					const callback = sublevel[callbackKey];
					if (!callback) {
						data.callback = null;
						data.function = null;
					} else {
						data.function = callback;
						const keys = [cid, toplevelKey, sublevelKey, callbackKey].map((key) => `['${key}']`).join('');
						data.callback = `___grecaptcha_cfg.clients${keys}`;
					}
				}
			});
			return data;
		});
	}
	return [];
}

const claimDaily = async (context) => {
	console.log('[Daily] Claiming daily case');
	let dailyPage = await context.newPage();
	await dailyPage.goto("https://key-drop.com/en/Daily_free");
	console.log('[Daily] Successfully reached daily page');
	await dailyPage.waitForSelector(config.selectors.daily_open);
	await dailyPage.click(config.selectors.daily_open);
	await wait(500);
	console.log('[Daily] Solving captcha');
	solveCaptchaOnPage(dailyPage)
	.then(() => {
		console.log('[Daily] Captcha solved / Not there');
		console.log('[Daily] Case should be opened automatically if your profile picture is correct');
	})
	.catch(e => {
		console.log('[Daily] Failed to solve captcha. Error: ' + e);
	})
	await wait(5000);
	await dailyPage.close()
}

const redeemCodeOnPage = async (page, code) => {
	/*
	await page.click(config.selectors.promo_code);
	console.log(`[Macro] Clicked "Promotional Code" button`);
	await erroredWait(200, 100);
	await page.click(config.selectors.code_input);
	console.log(`[Macro] Clicked code input field`);
	await erroredWait(150,100);
	await (await page.$x(config.selectors.code_input_xpath))[0].type(code);
	console.log(`[Macro] Typed ${code} into the field`);
	*/
	
	console.log(`[Macro] Redirecting to https://key-drop.com/?code=${code}`);
	await Promise.allSettled([
	    page.goto(`https://key-drop.com/?code=${code}`),
	    page.waitForNavigation({ waitUntil: 'domcontentloaded' })
    ]);

	await wait(1000);
	if(page.url() == `https://key-drop.com/en/?code=${code}#payment/promocode`) {
		console.log('[Macro] Redirecting to previous version');
		await Promise.allSettled([
			page.click(config.selectors.go_back),
			page.waitForNavigation({ waitUntil: 'domcontentloaded' })
		]);
		return redeemCodeOnPage(page, code);
	}

    console.log(`[Macro] Successfully redirected`);
    await wait(3000);

	await solveCaptchaOnPage(page)
	.then(async () => {
		let success = false;

		await erroredWait(1000, 100);
		await page.click(config.selectors.collect_button);

		await erroredWait(1000, 0);
		await page.click(config.selectors.x_button);
		console.log(`[Macro] Clicked x button`);

		return;
	})
	.catch(err => {
		console.log(`Failed to redeem code (${code}) due to ${err}`);
		return Error(err);
	});
}

const solveCaptchaOnPage = async (page) => {
	return new Promise(async (resolve, reject) => {
		console.log(`[Captcha] Finding reCaptchas`);
		let reClients = await page.evaluate(findRecaptchaClients);

		if(reClients[0] != undefined) {
			let sitekey = reClients[0].sitekey;
			let pageurl = reClients[0].pageurl;
			let callback = reClients[0].callback;

			console.log(`[Captcha] reCaptcha found`);

			getCaptchaSolution(sitekey, pageurl)
			.then(async solution => {
				console.log(`Solution: ${solution}`);

                // "Reference Error: solution is not defined" for the next two lines
				// let captchaResponseTextarea = await page.$("#g-recaptcha-response");
				// await captchaResponseTextarea.evaluate(el => el.innerHTML = ${solution});

                await page.evaluate(solution => document.getElementById("g-recaptcha-response").innerHTML = solution, solution);

				await page.evaluate((callback, solution) => eval(`${callback}('${solution}')`), callback, solution);		// callback takes the solution as the argument (i think)
				resolve();
			})
			.catch(reject);
		} else {
			resolve();
		}
	})
}

const getCaptchaSolution = (sitekey, pageurl) => {
	return new Promise(async (resolve, reject) => {
		const url = `http://2captcha.com/in.php?key=${config['2captcha_api_key']}&method=userrecaptcha&googlekey=${sitekey}&pageurl=${pageurl}&json=1`;
		console.log(`Making request to 2captcha Sitekey: ${sitekey} pageurl: ${pageurl}`);
		fetch(url)
		.then(res => res.json())
		.then(async res => {
			if(res.status == 1) {
				// Success
				let requestId = res.request;
				await wait(8000)
				checkIfCaptchaSolvedIterative(requestId, 40)
				.then(resolve)
				.catch(reject);
			} else {
				// Fail
				reject(res.request);
			}
		})
	})
}

const checkIfCaptchaSolvedRecursive = (reqId) => {				// I doubt this works
	return new Promise(async (resolve, reject) => {
		const url = `http://2captcha.com/res.php?key=${config['2captcha_api_key']}&action=get&id=${reqId}&json=1`;
		fetch(url)
		.then(res => res.json())
		.then(async res => {
			if(res.status == 1) {
				completed = true;
				resolve(res.request);
			} else {
				if(res.request == "CAPCHA_NOT_READY") {
					await wait(4000);
					resolve(checkIfCaptchaSolvedRecursive(reqId));
				} else {
					reject(res.request);
				}
			}
		})
	})
}

const checkIfCaptchaSolvedIterative = (reqId, maxAttempts) => {
	return new Promise(async (resolve, reject) => {
		const url = `http://2captcha.com/res.php?key=${config['2captcha_api_key']}&action=get&id=${reqId}&json=1`;
        let completed = false
		for(i = 0; i < maxAttempts; i++) {
			console.log(`[Captcha] Retrieving captcha: Attempt ${i}`);
			if(completed) break;
			fetch(url)
			.then(res => res.json())
			.then(async res => {
				console.log(res);
				if(res.status == 1) {
					console.log(`[Captcha] Recieved captcha solution in ${i} tries...`);
					completed = true;
					resolve(res.request);
				} else {
					console.log(`[Captcha] ${res.toString()}`);
					if(res.request == "CAPCHA_NOT_READY") {
					} else {
						completed = true;
						reject(res.request);
					}
				}
			})
			.catch(reject);
			await wait(8000);
		}
		reject(Error(`[Captcha] Captcha was not solved after ${maxAttempts} attempts`));
	})
}

class RedeemManager {
	constructor(pages, checkCodes = true) {
		this.pages = pages;
		this.codeQueue = [];
		this.checkCodes = checkCodes;
		this.isRedeeming = false;
	}

	async _redeemNext() {
		console.log('[Redeemer] Redeeming next code in queue');
		this.isRedeeming = true;
		while(this.codeQueue.length > 0) {
			let code = this.codeQueue[0];
			if(this.checkCodes) {
				console.log(`[Redeemer] Checking code: ${code}`);
				let res = await redeemCodeOnPage(this.pages[0], code);
				if(res === true) {
					await Promise.allSettled(this.pages.slice(1).map(page => redeemCodeOnPage(page, code)));
				} else {
					console.log(`Code failed: ${code} ${res === false ? '' : `due to ${res}`}`);
				}
			} else {
				console.log(`[Redeemer] Redeeming code ${code}`);
				await Promise.allSettled(this.pages.map(page => redeemCodeOnPage(page, code)));
			}
			this.codeQueue.shift();
		}
		this.isRedeeming = false;
	}

	redeem(code) {
		this.codeQueue.push(code);
		if(!this.isRedeeming) this._redeemNext();
	}
}

Discord.Message.prototype.getCode = function() {
	if(config.golden_code_channels.includes(this.channelId)) {
		if(this.author.id == config.recievingFromBot_id) {			// Keydrop
			if(this.content?.length == 17) {
				return this.content
			}
		}
	}

	return false;
}

run();
