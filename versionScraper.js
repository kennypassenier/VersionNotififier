'use strict'

const puppeteer = require("puppeteer");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");

const config = require("./config.json");



let stoofvleesUrl = "https://chrome.google.com/webstore/detail/stoofvlees-chrome/ipheccjckppkofmllgfeefghdfnbbagf";
let redditUrl = 'https://chrome.google.com/webstore/detail/reddit%2B%2B/bcjcjglmaohopjjeigcocfgobdoaekpo';
let pirateUrl = 'https://chrome.google.com/webstore/detail/pirate%2B%2B/apfokdnjaoeolgicbochegnciadipjpc';

let urlArray = [stoofvleesUrl, redditUrl, pirateUrl];
//let urlArray = [stoofvleesUrl];

for (let urlIndex in urlArray){
    //console.log(urlArray[urlIndex])
    GetVersionNumber(urlArray[urlIndex]);
}
async function GetVersionNumber(url){
    //console.log("Start of GetVersionNumber");
    //console.log("URL: " + url);




    // Create a Browser instance
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    // Viewport isn't really necessary
    await page.setViewport({width: 1920, height: 1080});

    // Actually go to the page
    await page.goto(url);
    // Wait until the right information gets loaded and appears on the site
    await page.waitForSelector(".e-f-w");
    await page.waitForSelector(".h-C-b-p-D-md");
    // Scrape the relevant information
    let information = await page.evaluate(
        () => {
            let name = document.getElementsByClassName("e-f-w")[0].textContent;
            //console.log("Name: " + name);
            let version = document.getElementsByClassName("h-C-b-p-D-md")[0].textContent;
            //console.log("Version: " + version);
            return [name, version]
        }
    );
    // Close the Browser again
    await browser.close();


    let version = information[1];
    // Split version into 3 integers
    let [v1, v2, v3] = version.split(".");
    v1 = parseInt(v1);
    v2 = parseInt(v2);
    v3 = parseInt(v3);
    let name = information[0];

    // Now that we have both the name and the version of the app, we can check our DB to see if the name exists
    CheckDatabase([name, v1, v2, v3]);

    //console.log("End of GetVersionNumber");
    // Return the wanted value
    return information;
}

// In order of creation:
//let stoofvleesPromise = GetVersionNumber(stoofvleesUrl)
//let redditPromise = GetVersionNumber(redditUrl);
//let piratePromise = GetVersionNumber(pirateUrl);


async function CheckDatabase(parArray){
    //console.log("Start of CheckDatabase");
    let [pName, pV1, pV2, pV3] = parArray;
    console.log("Name : " + pName);

    let isInDB = false;

    let db = new sqlite3.Database("./Database/appinfo.db");
    let sql = `SELECT * FROM apps where Name = "${pName}"`;
    //console.log(sql);
    db.each(sql, (err, row)=>{
        // We will only enter this if it actually finds an entry, otherwise this whole block will be skipped.
        if(err){
            console.log("There was an error");
            console.log(err.message);
        }
        //console.log("Logging the row: ");
        //console.log(row);
        if(row.V1 === pV1 && row.V2 === pV2 && row.V3 === pV3){
            // The version number has not changed, we don't have to do anything
            //console.log(`Nothing has changed for ${pName}`);
        }
        else{
            // Something has changed, we have to update the database and send a notification
            console.log("About to update database");
            UpdateDatabase(pName, pV1, pV2, pV3);
            SendNotification(pName, pV1, pV2, pV3);
        }
        // Set this to true so we know that there was actually a result
        //console.log("Setting isInDb to true!");
        isInDB = true;
    }); // End of .each();
    // Now we can check whether the result was actually found in the db, otherwise we will have to create a new entry


    // Bug: We have to wait for the last function to finish before we can check if isInDb changed
    // There has to be a more elegant solution to this problem
    setTimeout(function () {
        console.log("Checking if the app exists in our database");
        //console.log("Do we exist in the db? " + isInDB);
        if(!isInDB){
            // The record does not exist
            // We can safely add this application to the database
            console.log("The row doesn't exist in the db, we have to add it");
            AddRowToDatabase(pName, pV1, pV2, pV3);
        }

    }, 5000);

    //console.log("End of CheckDatabase");

    //return answer;
}

function UpdateDatabase(name, v1, v2, v3){
    //console.log("Start of UpdateDatabase");

    let db = new sqlite3.Database("./Database/appinfo.db");
    let sql = `UPDATE apps set V1 = ${v1}, V2 = ${v2}, V3 = ${v3} where Name = "${name}"`;
    console.log("SQL: " + sql);
    db.run(sql, function(err){
        if(err){
            console.log(err.message);
            return;
        }
        console.log(`Row updated: ${this.changes}`);
    });
    db.close();

    //console.log("End of UpdateDatabase");
}

function AddRowToDatabase(name, v1, v2, v3){
    // Seems to work as intended
    //console.log("Start of AddRowToDatabase");

    let db = new sqlite3.Database("./Database/appinfo.db");
    db.run("INSERT INTO Apps(Name, V1, V2, V3) VALUES(?, ?, ?, ?)", [name, v1, v2, v3], function(err){
        if(err){
            return console.log(err.message);
        }
        console.log("Row has been added to the table: " + this.lastID);
    });

    //console.log("Start of AddRowToDatabase");
}

function SendNotification(name, v1, v2, v3){

    //console.log("Start of SendNotification");

    var date = new Date();
    var day = date.getDay();
    var month = date.getMonth();
    var year = date.getFullYear();
    var dateString = `${day}/${month}/${year}`;



    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.gmail.username,
            pass: config.gmail.password
        }
    });

    var mailOptions = {
        from: config.gmail.username,
        to: config.gmail.receiver,
        subject: `Chrome extension update ${dateString}`,
        text: `${name} has been updated to version ${v1}.${v2}.${v3}`
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    //console.log("End of SendNotification");
}
