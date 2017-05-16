#!/usr/bin/env node

var amqp = require('amqplib/callback_api');
var config = require('../config.js');
var Crawler = require('../Classes/Crawler.js');

amqp.connect(config.rabbitmq.url, function(err, conn) {
	conn.createChannel(function(err, ch) {
		var q = config.rabbitmq.queues.simple;

		ch.assertQueue(q, {
			durable: false
		});
		ch.prefetch(1);
		console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);


		ch.consume(q, function reply(msg) {
			console.log(" [x] Received %s", msg.content.toString());
			var data = JSON.parse(msg.content.toString());
			var crawler = new Crawler();

			crawler.crawl(data.url, data.jobId, function(res) {
				console.log('CRAWLED', res.status, res.url);


				ch.sendToQueue(msg.properties.replyTo,
					new Buffer(res.status.toString()), {
						correlationId: msg.properties.correlationId
					});

				console.log('trying to ack');

				ch.ack(msg);

				console.log('ACK %s',msg.properties.correlationId);
			});


		});
	});
});