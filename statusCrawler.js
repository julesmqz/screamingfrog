var casper = require('casper').create();


var links;

function getLinks() {
	// Scrape the links from top-right nav of the website
	var links = document.querySelectorAll('a');
	return Array.prototype.map.call(links, function(e) {
		return e.getAttribute('href')
	});
}


casper.start('http://www.cochemania.mx/');

casper.then(function() {
	this.echo('Crawl Page: ' + this.getTitle());
	var status = this.status(false);
	this.echo('Status Code: ' + status.currentHTTPStatus);

	/*if (status.currentHTTPStatus == 200) {
		links = this.evaluate(getLinks);

		for (var i in links) {
			console.log(links[i]);
		}
	}*/


});

casper.run();