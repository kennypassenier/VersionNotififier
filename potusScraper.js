const rp = require("request-promise");
const $ = require("cheerio")
const url = "https://en.wikipedia.org/wiki/List_of_Presidents_of_the_United_States";

rp(url).then(function(html){
    // Success
    console.log($("big > a", html).length);
    console.log($("big > a", html))




}).catch(function(err){
    // Handle error
    console.log("There was an error!");
    console.log(err.toString());
})