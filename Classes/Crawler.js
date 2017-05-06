var restify = require('restify');
var Q = require('q');
var client = restify.createStringClient({
	url: 'http://127.0.0.1:8585'
});

function Crawler() {

}

Crawler.prototype.crawlHeaders = function(url, cb) {
	console.log('Crawling Headers for ', url);
	var promise = Q.defer();
	client.post('/', {
		address: url,
		headers: true
	}, function(err, rq, rs, obj) {
		promise.resolve();
	});

	promise.promise.then(function() {
		console.log('Crawled ', url);
		cb.apply(null, [obj, err]);
	});
};

Crawler.prototype.crawl = function(url) {
	console.log('Crawling ')
	client.post('/', {
		address: url
	}, function(err, rq, rs, obj) {
		console.log(obj);
		res.send(JSON.parse(obj), 200);
		next();
	});
};

Crawler.prototype.sleep = function(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds) {
			break;
		}
	}
};


module.exports = Crawler;