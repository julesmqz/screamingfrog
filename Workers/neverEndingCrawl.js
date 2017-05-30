#!/usr/bin/env node

var amqp = require('amqplib/callback_api');
var config = require('../config.js');
var RQC = require('../Classes/RabbitMqClass');

var rabbit = new RQC();

amqp.connect(config.rabbitmq.url, function(err, conn) {
	conn.createChannel(function(err, ch) {
		var q = config.rabbitmq.queues.specific;
		var qS = q + '-slave';

		ch.assertQueue(q, {
			durable: false
		});
		console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
		ch.consume(q, function(msg) {
			console.log(" [x] Received %s", msg.content.toString());
			var data = JSON.parse(msg.content.toString());
			var urls = [];
			data.oxids.forEach(function(o) {
				data.urls.forEach(function(u) {
					rabbit.send(qS, {
						url: u
					}, function(corr) {
						console.log('SENT with corr %s', corr);
					}, function(data, conn) {
						console.log('Job answer with data %s', data.success);

						// Save into remote DATABASE
						console.log('Save into remote DB');
					});
				});
			});



		});
	});
});