#!/usr/bin/env node

var amqp = require('amqplib/callback_api');
var config = require('../config.js');
var Crawler = require('../Classes/Crawler.js');

amqp.connect(config.rabbitmq.url, function(err, conn) {
	conn.createChannel(function(err, ch) {
		var args = process.argv.slice(2);
		var q = args[0] || config.rabbitmq.queues.simple;

		ch.assertQueue(q, {
			durable: false,
			autoDelete: true
		});
		ch.prefetch(1);
		console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);


		ch.consume(q, function reply(msg) {
			console.log(" [x] Received %s", msg.content.toString());
			var data = JSON.parse(msg.content.toString());
			var crawler = new Crawler();

			crawler.crawl(data.url, data.jobId, function(res) {
				console.log('CRAWLED', res.status, res.url);

				var data2 = {};

				data2.status = res.status;
				data2.promiseKey = data.promiseKey;
				data2.url = res.url;

				console.log('delay ack %s seconds', data.delay);

				setTimeout(function() {
					ch.sendToQueue(msg.properties.replyTo,
						new Buffer(JSON.stringify(data2)), {
							correlationId: msg.properties.correlationId
						});
					ch.ack(msg);
					console.log('ACK %s', msg.properties.correlationId);
				}, data.delay * 1000);
			});


		});
	});
});