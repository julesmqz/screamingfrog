var Crawler = require('./Crawler.js');
var Q = require('q');
var config = require('../config.js');
var mysql = require('mysql');


function DbCrawler() {
	Crawler.call(this);
}
// Setup the prototype chain mmm... calling
// the Animal without the required params?
DbCrawler.prototype = new Crawler();

DbCrawler.prototype.getTableUrls = function(query, connId, cb) {
	console.log('Crawling ', query);
	var promises = [];
	var urls = [];
	var self = this;

	var connection = mysql.createConnection(config.shops[connId].database);
	connection.connect();

	connection.query(query, function(error, results, fields) {
		if (error) {
			connection.end();
			throw error;
		}

		// console.log(results.length);

		if (results.length > 0) {
			results.forEach(function(result) {
				var p = Q.defer();
				promises.push(p.promise);
				urls.push(result.url);
				p.resolve();
			});
		}
		connection.end();
		
		Q.all(promises).then(function() {
			cb.apply(null, [urls]);
		});
	});
}


module.exports = DbCrawler;