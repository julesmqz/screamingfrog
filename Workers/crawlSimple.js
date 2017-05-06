#!/usr/bin/env node

var amqp = require('amqplib/callback_api');
var Crawler = require('../Classes/Crawler.js');

amqp.connect('amqp://localhost', function(err, conn) {
	conn.createChannel(function(err, ch) {
		var q = 'simple-crawl';

		ch.assertQueue(q, {
			durable: false
		});
		console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);


		ch.consume(q, function(msg) {
			var wait = true;
			console.log(" [x] Received %s", msg.content.toString());
			var data = JSON.parse(msg.content.toString());
			var crawler = new Crawler();

			crawler.crawlHeaders(data.url, function(res) {
				console.log(res);
				ch.ack(msg);
			});
		});



	});
});