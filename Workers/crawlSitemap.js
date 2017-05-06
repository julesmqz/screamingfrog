#!/usr/bin/env node

var amqp = require('amqplib/callback_api');
var SitemapCrawler = require('../Classes/SitemapCrawler.js');

amqp.connect('amqp://localhost', function(err, conn) {
	conn.createChannel(function(err, ch) {
		var q = 'sitemap-crawl';

		ch.assertQueue(q, {
			durable: false
		});
		console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
		ch.consume(q, function(msg) {
			console.log(" [x] Received %s", msg.content.toString());
			var data = JSON.parse(msg.content.toString());
			var crawler = new SitemapCrawler();

			crawler.getSitemapUrls(data.sitemapUrl, function(urls) {
				console.log('Done. Total urls: ', urls.length);

				amqp.connect('amqp://localhost', function(err, conn) {
					conn.createChannel(function(err, ch) {
						var q = 'simple-crawl';

						urls.forEach(function(url) {
							var data = {};
							data.id = Date.now();
							data.msg = 'Starting simple crawl'
							data.url = url
							data.started = true;

							ch.assertQueue(q, {
								durable: false
							});

							// Note: on Node 6 Buffer.from(msg) should be used
							ch.sendToQueue(q, new Buffer(JSON.stringify(data)));
							console.log(" [x] Start job simple crawl");


						});
					});

					setTimeout(function() {
						conn.close();
					}, 5000);



				});


			});

		}, {
			noAck: true
		});
	});
});