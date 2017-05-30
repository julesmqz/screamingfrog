var restify = require('restify');
var amqp = require('amqplib/callback_api');
var config = require('./config.js');
var extend = require('util')._extend
var mysql = require('mysql');

var pool = mysql.createPool(config.database);

var server = restify.createServer();
server.use(restify.bodyParser());

// Region functions
function crawlSitemap(req, res, next) {
	var data = {
		id: Date.now(),
		started: false
	};
	var shops = config.shops;
	if (shops[req.params.k] != undefined) {
		var q = config.rabbitmq.queues.sitemap;
		var shop = shops[req.params.k];
		data.msg = 'Starting sitemap crawl'
		data.sitemapUrl = shop.url + shop.sitemap;
		data.delay = parseInt(req.params.delay);
		data.concurrency = parseInt(req.params.concurrency);

		var insert = {
			delay: data.delay,
			concurrency: data.concurrency,
			url: data.sitemapUrl,
			shop: shop.name,
			type: 'sitemap',
			cpid: data.id
		}

		pool.query('INSERT INTO yt_job SET ?', insert, function(err, results, fields) {
			if (err) throw err;

			amqp.connect(config.rabbitmq.url, function(err, conn) {
				conn.createChannel(function(err, ch) {
					data.started = true;
					ch.assertQueue(q, {
						durable: false
					});
					// Note: on Node 6 Buffer.from(msg) should be used
					ch.sendToQueue(q, new Buffer(JSON.stringify(data)));
					console.log(" [x] Start job sitemap");
				});
				setTimeout(function() {
					conn.close();
					res.send(data, 200);
					next();
				}, 1000);
			});


		});


	} else {
		res.send(data, 200);
		next();
	}
};

function crawlDb(req, res, next) {
	var data = {
		id: Date.now(),
		started: false
	};

	var shops = config.shops;
	if (shops[req.params.k] != undefined) {
		var shop = shops[req.params.k];
		var table = req.params.t;
		if (shop.queries[table] != undefined) {
			var q = config.rabbitmq.queues.db;
			data.query = shop.queries[table];

			data.msg = 'Starting db crawl in table: ' + table;
			data.table = table;
			data.delay = parseInt(req.params.delay);
			data.concurrency = parseInt(req.params.concurrency);
			data.connid = parseInt(req.params.k);

			var insert = {
				delay: data.delay,
				concurrency: data.concurrency,
				url: data.table,
				shop: shop.name,
				type: 'db',
				cpid: data.id
			}

			pool.query('INSERT INTO yt_job SET ?', insert, function(err, results, fields) {
				if (err) throw err;

				amqp.connect(config.rabbitmq.url, function(err, conn) {
					conn.createChannel(function(err, ch) {
						data.started = true;
						ch.assertQueue(q, {
							durable: false
						});
						// Note: on Node 6 Buffer.from(msg) should be used
						ch.sendToQueue(q, new Buffer(JSON.stringify(data)));
						console.log(" [x] Start job db");
					});
					setTimeout(function() {
						conn.close();
						res.send(data, 200);
						next();
					}, 1000);
				});
			});
		}


	} else {
		res.send(data, 200);
		next();
	}
}

function crawlSpecific(req, res, next) {
	if (req.params.oxids == 'undefined') {
		res.send({
			error: 'Not cool bro. Send some ids'
		}, 500);
		next();
	} else {
		var data = {
			id: 'neverEndingCrawl'
		};

		var shops = config.shops;
		var oxids = req.params.oxids;
		if (shops[req.params.k] != undefined) {
			var shop = shops[req.params.k];
			var q = config.rabbitmq.queues.specific;
			data.msg = 'Starting specific crawling for ' + oxids.length + ' number of links';
			data.delay = parseInt(req.params.delay);
			data.concurrency = parseInt(req.params.concurrency);
			data.connid = parseInt(req.params.k);
			data.oxids = oxids;
			data.urls = shop.altUrls;

			amqp.connect(config.rabbitmq.url, function(err, conn) {
				conn.createChannel(function(err, ch) {
					data.started = true;
					ch.assertQueue(q, {
						durable: false
					});
					// Note: on Node 6 Buffer.from(msg) should be used
					ch.sendToQueue(q, new Buffer(JSON.stringify(data)));
					console.log(" [x] Start job specific");
				});
				setTimeout(function() {
					conn.close();
					res.send(data, 200);
					next();
				}, 1000);
			});



		} else {
			res.send(data, 500);
			next();
		}
	}
}
// endregion

server.get('/', function(req, res, next) {
	res.send({
		msg: 'Crawler Rest server working correctly'
	}, 200);
	next();
});

server.get('/crawlSitemap/:k/:delay/:concurrency', crawlSitemap);
server.post('/crawlSitemap', crawlSitemap);

server.get('/crawlDb/:k/:t/:delay/:concurrency', crawlDb);
server.post('/crawlDb', crawlDb);

server.post('crawlSpecific/:k/:delay/:concurrency', crawlSpecific);



server.listen(config.server.port, function() {
	console.log('%s listening at %s', server.name, server.url);
});