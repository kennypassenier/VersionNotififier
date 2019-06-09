const puppeteer = require("puppeteer");

//var url = 'https://chrome.google.com/webstore/detail/reddit%2B%2B/bcjcjglmaohopjjeigcocfgobdoaekpo';
var url = 'https://chrome.google.com/webstore/detail/pirate%2B%2B/apfokdnjaoeolgicbochegnciadipjpc';
var selector = ".h-C-b-p-D-md";

(async () => {
    //console.log("Start");
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.setViewport({width: 3840, height: 2160});


    // Actually go to the page
    await page.goto(url);
    // Wait until the right information pops up
    await page.waitForSelector(selector);
    // Scrape the relevant information
    var versionNumber = await page.evaluate( () => {
        return document.getElementsByClassName("h-C-b-p-D-md")[0].textContent;
    } );

    //console.log('versionNumber: ');
    console.log(await versionNumber);
    await page.screenshot({path: "screenshot.png", fullPage: true})

    await browser.close();
    //console.log("Finish");
})();