#!/usr/bin/env node

var config = require('../config');
var RQC = require('../Classes/RabbitMqClass');

var rabbit = new RQC();
//var pool = mysql.createPool(config.database);

var args = process.argv.slice(2);
var q = config.rabbitmq.queues.specific + '-slave';

rabbit.listen(q, function(data, res) {
	var data2 = {
		url: data.url,
		success: false
	};
	console.log('Crawling ', data.url);

	request(data.url, {
		timeout: config.server.requestTimeout
	}, function(error, response, body) {
		if (error) throw error;


		data2.success = true;
		// console.log('error:', error); // Print the error if one occurred
		// console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		rabbit.ACK(data2, res.channel, res.message);



	});


	//rabbit.ACK(data2, res.channel, res.message);
	//rabbit.close(res.conn);
});


function makeCsv(options) {
	var csv = json2csv(options);
	return csv;
}