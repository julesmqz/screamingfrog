#!/usr/bin/env node

var amqp = require('amqplib/callback_api');
var config = require('../config.js');
var DbCrawler = require('../Classes/DbCrawler.js');

amqp.connect(config.rabbitmq.url, function(err, conn) {
	conn.createChannel(function(err, ch) {
		var q = config.rabbitmq.queues.db;

		ch.assertQueue(q, {
			durable: false
		});
		console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
		ch.consume(q, function(msg) {
			console.log(" [x] Received %s", msg.content.toString());
			var data = JSON.parse(msg.content.toString());
			var crawler = new DbCrawler();

			crawler.getTableUrls(data.query,data.connid, function(urls) {
				console.log('Done. Total urls: ', urls.length);
				crawler.sendToQueue(urls,data.concurrency,data.delay,data.id);
			});

		}, {
			noAck: true
		});
	});
});