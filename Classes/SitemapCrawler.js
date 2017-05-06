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

SitemapCrawler.prototype.getSitemapUrls = function(url, cb) {
	console.log('Crawling ', url);
	var promise = Q.defer();
	var urls = [];
	var self = this;
	request(url, function(error, response, body) {
		// console.log('error:', error); // Print the error if one occurred
		// console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		// console.log('body:', body); // Print the HTML for the Google homepage.

		// xml to json 
		var json = JSON.parse(parser.toJson(body));
		var promises = [];
		if (json.hasOwnProperty('sitemapindex')) {
			json.sitemapindex.sitemap.forEach(function(uri) {
				if (typeof uri != 'undefined') {
					var p = Q.defer();
					promises.push(p.promise);
					self.getSitemapUrls(uri.loc, function(uris) {
						console.log('Find all urls for ', uri.loc, ' Total', uris.length);
						urls = urls.concat(uris);
						console.log('Total urls ',urls.length);
						p.resolve();
					});
				}


			});
		} else {
			json.urlset.url.forEach(function(uri) {
				// console.log('find url: ', uri.loc);
				var p = Q.defer();
				promises.push(p.promise);
				urls.push(uri.loc);
				p.resolve();
			});
		}

		Q.all(promises).then(function() {
			promise.resolve();
		});

		promise.promise.then(function() {
			cb.apply(null, [urls]);
		});
	});
}


module.exports = SitemapCrawler;