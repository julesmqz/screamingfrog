#!/usr/bin/env node

var mysql = require('mysql');
var amqp = require('amqplib/callback_api');
var config = require('../config.js');
var RQC = require('../Classes/RabbitMqClass');

var rabbit = new RQC();
var pool = mysql.createPool(config.shops[1].database);

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
						url: u + '/index.php?cl=details&anid=' + o
					}, function(corr) {
						console.log('SENT with corr %s', corr);
					}, function(data, conn) {
						console.log('Job answer with data %s', data.success);

						// Save into remote DATABASE
						console.log('Save into remote DB');

						var obj = ['processed', o];

						pool.query('UPDATE cache_creator SET status=? WHERE oxid=?', obj, function(err, results, fields) {
							if (err) throw err;
							console.log('Updated into db');
						});
					});
				});
			});



		});
	});
});