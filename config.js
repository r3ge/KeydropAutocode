// Help and youtube tutorial link https://github.com/r3ge/KeydropAutocode#readme
// If you dont know how to set it up, download the latest zip from https://github.com/r3ge/KeydropAutocode/releases/
module.exports = {
    // "discord_token": "Enter discord token here", 
    "discord_token": "OTc1Mzk5MzgwMzQzNDY4MDk0.G0TS0E.yy6rekGnTP7z4FwKVDju_W51EMZuVNqRvDNTAQ", 
	"2captcha_api_key": "01393fbfde8dd777f45e028a309836ea",                                
    "recievingFromBot_id": "886331989043609620",              
    "chromePath": "C:/Program Files/Google/Chrome/Application/chrome.exe",                       
    "headless": false,
    "golden_code_channels": ["975328045865009162"],          
    "useragent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.82 Safari/537.36",
    "selectors": {
        "promo_code": "body > header > div.hidden.overflow-hidden.md\\:block.bg-navy-700 > nav > ul > li.pr-2.mr-2.border-r-2.border-navy-600 > button",
        // "code_input": "#promo-code-root > div > div.relative.grid.css-126rogm > div.relative.flex.flex-col.items-center.justify-center.col-start-1.row-start-1.px-10.py-5.text-center.transition-opacity.duration-500.md\\:px-20 > input",
        // "code_input_xpath": '//*[@id="promo-code-root"]/div/div[1]/div[2]/input',
        "collect_button": "#promo-code-root > div > div.relative.grid.css-126rogm > div.relative.flex.flex-col.items-center.justify-center.col-start-1.row-start-1.px-10.py-5.text-center.transition-opacity.duration-500.md\\:px-20 > button",
        "x_button": "#promo-code-root > div > div.relative.grid.css-126rogm > button",
        "toast_div": "body > div.toast-container.js-toast-container",
        "fail_toast_div": "body > div.toast-container.js-toast-container > div",
        "toast_desc_p": "body > div.toast-container.js-toast-container > div > div > div.toast__text > p.toast__desc",
        "recaptcha_frame": "#promo-code-root > div > div.relative.grid.css-126rogm > div.relative.flex.flex-col.items-center.justify-center.col-start-1.row-start-1.px-10.py-5.text-center.transition-opacity.duration-500.md\\:px-20 > div > div > div > div > div > iframe",
        "go_back": "body > reach-portal > div:nth-child(3) > div > div > div > div > a",
        "daily_open": "#dailyCase-root > div.container.hide-scrollbar.snap-x.snap-mandatory.overflow-x-auto > ul > li:nth-child(1) > button > div > div > canvas",
        "golden_code_tab_button": "#headlessui-dialog-panel-3 > div.shrink-0 > div > button.flex.h-full.flex-1.items-center.justify-center.gap-x-3.bg-\\[\\#23232D\\].text-sm.uppercase.text-white.transition-colors.duration-150.hover\\:bg-navy-500",
        "code_input": "#headlessui-dialog-panel-3 > div.shrink-1.custom-scrollbar.relative.h-full.grow.overflow-hidden.overflow-y-auto.overflow-x-hidden.transition-opacity.duration-200 > div > div.rounded-b-xl.bg-\\[\\#1F1F27\\].p-2.sm\\:p-8 > div.relative.z-10.rounded-xl.bg-navy-750.p-5 > div > div > input",
        "apply_button": "#headlessui-dialog-panel-3 > div.shrink-1.custom-scrollbar.relative.h-full.grow.overflow-hidden.overflow-y-auto.overflow-x-hidden.transition-opacity.duration-200 > div > div.rounded-b-xl.bg-\\[\\#1F1F27\\].p-2.sm\\:p-8 > div.relative.z-10.rounded-xl.bg-navy-750.p-5 > div > button"
    }
}
