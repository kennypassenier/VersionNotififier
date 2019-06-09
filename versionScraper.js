const rp = require("request-promise");
const cheerio = require("cheerio");

const selector = 'span.C-b-p-D-Xe.h-C-b-p-D-md';

options = {
    url: "https://chrome.google.com/webstore/detail/reddit%2B%2B/bcjcjglmaohopjjeigcocfgobdoaekpo",
    transform: function(body, response, resolveWithFullResponse){
        console.log("Used the transform function in options!");
        return cheerio.load(body);
    }
};

rp(options).then(function($){
    console.log("Success!");
    var test = $(selector);
    if(test.length > 0){
        console.log("The selector has selected at least one element");
        console.log(test.textContent);
    }
    else{
        console.log("Failed to select anything!");
    }

}).catch(function (error){
    console.log("There has been an error: ");
    console.log(error);
});
