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
		data.speed = parseInt(req.params.speed);
		data.concurrency = parseInt(req.params.concurrency);

		var insert = {
			speed: data.speed,
			concurrency: data.concurrency,
			url: data.sitemapUrl,
			shop: shop.name,
			type: 'sitemap',
			cpid: data.id
		}

		pool.query('INSERT INTO job SET ?', insert, function(err, results, fields) {
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
			data.speed = parseInt(req.params.speed);
			data.concurrency = parseInt(req.params.concurrency);
			data.connid = parseInt(req.params.k);

			var insert = {
				speed: data.speed,
				concurrency: data.concurrency,
				url: data.table,
				shop: shop.name,
				type: 'db',
				cpid: data.id
			}

			pool.query('INSERT INTO job SET ?', insert, function(err, results, fields) {
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
// endregion

server.get('/', function(req, res, next) {
	res.send({
		msg: 'Crawler Rest server working correctly'
	}, 200);
	next();
});

server.get('/crawlSitemap/:k/:speed/:concurrency', crawlSitemap);
server.post('/crawlSitemap', crawlSitemap);

server.get('/crawlDb/:k/:t/:speed/:concurrency', crawlDb);
server.post('/crawlDb', crawlDb);



server.listen(config.server.port, function() {
	console.log('%s listening at %s', server.name, server.url);
});