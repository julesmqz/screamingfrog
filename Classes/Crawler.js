var amqp = require('amqplib/callback_api');
var Q = require('q');
var request = require('request');
var mysql = require('mysql');
var config = require('../config.js');

var pool = mysql.createPool(config.database);

function Crawler() {

}

Crawler.prototype.sendToQueue = function(urls, concurrency, speed, jobId) {
	var self = this;
	amqp.connect(config.rabbitmq.url, function(err, conn) {
		conn.createChannel(function(err, ch) {
			var q = config.rabbitmq.queues.simple;

			ch.assertQueue('', {
				exclusive: true
			}, function(err, queue) {

				var corr = jobId.toString();
				ch.consume(queue.queue, function(msg) {
					if (msg.properties.correlationId == corr) {
						console.log(' [.] Got %s', msg.content.toString());
					}
				}, {
					noAck: true
				});

				urls.forEach(function(url) {
					var data = {};
					data.id = Date.now();
					data.msg = 'Starting simple crawl'
					data.url = url
					data.started = true;
					data.jobId = jobId;

					// Note: on Node 6 Buffer.from(msg) should be used
					ch.sendToQueue(q, new Buffer(JSON.stringify(data)), {
						correlationId: corr,
						replyTo: queue.queue
					});
					console.log(" [x] Start job simple crawl");
				});
			});

		});

		/*setTimeout(function() {
			console.log('Closing connection');
			conn.close();
		}, (speed * chunks.length) + (speed / 2));*/
	});


	/*var chunks = [],
		i = 0,
		n = urls.length,
		gap = 0;

	while (i < n) {
		chunks.push(urls.slice(i, i += concurrency));
	}

	console.log(chunks);*/

	/*if (chunks.length > 0) {
		
	}*/
};

Crawler.prototype.crawl = function(url, jobId, cb) {
	console.log('Crawling ', url);

	request(url, function(error, response, body) {
		if (error) throw error;
		// console.log('error:', error); // Print the error if one occurred
		// console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received

		var obj = {
			jobId: jobId,
			status: response.statusCode,
			url: url,
			body: body
		}

		pool.query('INSERT INTO response SET ?', obj, function(err, results, fields) {
			if (err) throw err;
			console.log('Inserted into db');
			cb.apply(null, [obj, error]);
		});



	});
};

Crawler.prototype.generateUuid = function(jobId) {
	return jobId +
		Math.random().toString() +
		Math.random().toString() +
		Date.now().toString();
};


module.exports = Crawler;