var amqp = require('amqplib/callback_api');
var Q = require('q');
var request = require('request');
var mysql = require('mysql');
var config = require('../config.js');

var pool = mysql.createPool(config.database);

function Crawler() {

}

Crawler.prototype.sendToQueue = function(urls, delay, jobId) {
	var self = this;
	amqp.connect(config.rabbitmq.url, function(err, conn) {
		conn.createChannel(function(err, ch) {
			var q = config.rabbitmq.queues.simple;

			ch.assertQueue('', {
				exclusive: true
			}, function(err, queue) {
				var promises = [];
				var corr = jobId.toString();
				ch.consume(queue.queue, function(msg) {
					var data = JSON.parse(msg.content.toString());
					if (msg.properties.correlationId == corr) {
						promises[data.promiseKey].resolve();
						console.log(' [.] Got %s for %s', data.status, data.url);
					}
				}, {
					noAck: true
				});

				urls.forEach(function(url) {
					var p = Q.defer();
					promises.push(p);
					var data = {};
					data.id = Date.now();
					data.msg = 'Starting simple crawl'
					data.url = url
					data.started = true;
					data.jobId = jobId;
					data.promiseKey = promises.length - 1;
					data.delay = delay;

					// Note: on Node 6 Buffer.from(msg) should be used
					ch.sendToQueue(q, new Buffer(JSON.stringify(data)), {
						correlationId: corr,
						replyTo: queue.queue
					});
					console.log(" [x] Start job simple crawl");
				});



				Q.all(promises.map(function(p) {
					return p.promise;
				})).then(function() {
					console.log('Kill All workers.');

					console.log('Save to db');
					var obj = [true, jobId];
					pool.query('UPDATE yt_job SET finished=? WHERE cpid=?', obj, function(err, results, fields) {
						if (err) throw err;
						console.log('Updated db');
						console.log('Notify... maybe');

						setTimeout(function() {
							console.log('Closing connection');
							conn.close();
						}, 500);

					});
				});
			});

		});


	});
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

		pool.query('INSERT INTO yt_response SET ?', obj, function(err, results, fields) {
			if (err) throw err;
			console.log('Inserted into db');
			obj.insertId = results.insertId;
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