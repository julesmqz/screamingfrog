var Crawler = require('./Crawler.js');
var request = require('request');
var parser = require('xml2json');
var Q = require('q');

function SitemapCrawler() {
	Crawler.call(this);
}
// Setup the prototype chain mmm... calling
// the Animal without the required params?
SitemapCrawler.prototype = new Crawler();

SitemapCrawler.prototype.getSitemapUrls = function(url) {
	var promise = Q.defer();
	var urls = [];
	var self = this;
	request(url, function(error, response, body) {
		console.log('error:', error); // Print the error if one occurred
		console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		console.log('body:', body); // Print the HTML for the Google homepage.

		// xml to json 
		var json = parser.toJson(body);
		if( json.hasOwnProperty('sitemapindex')){
			json.sitemapindex.sitemap.forEach(function(uri){
				var uris = self.getSitemapUrls(uri.loc);
				urls.concat(uris);
			});
		}else{

		}
	});
}


module.exports = SitemapCrawler;