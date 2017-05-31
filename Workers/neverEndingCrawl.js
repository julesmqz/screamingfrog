#!/usr/bin/env node

var mysql = require('mysql');
var request = require('request');
var config = require('../config.js');
var RQC = require('../Classes/RabbitMqClass');

var rabbit = new RQC();
var pool = mysql.createPool(config.shops[1].database);
var q = config.rabbitmq.queues.specific;
rabbit.listen(q, function(data, res) {
	console.log('Gonna Crawl %s with uid %s', data.url, data.uid);


	request(data.url, {
		timeout: config.server.requestTimeout
	}, function(error, response, body) {
		var data2 = {
			response: response && response.hasOwnProperty(statusCode) ? response.statusCode : null,
			uid: data.uid
		};

		if (error) {
			rabbit.ACK(data2, res.channel, res.message);
			throw error;
		}

		//response.statusCode;
		console.log('Save into remote DB');
		var obj = ['processed',data.oxid];
		pool.query('UPDATE cache_creator SET status=? WHERE oxid=?', obj, function(err, results, fields) {
			if (error) {
				data2.response = null;
				rabbit.ACK(data2, res.channel, res.message);
				throw error;
			}
			console.log('Updated into db');

			setTimeout(function() {
				rabbit.ACK(data2, res.channel, res.message);
			}, 10000);

		});


	});
});