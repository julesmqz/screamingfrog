var amqp = require('amqplib/callback_api');
var Q = require('q');
var request = require('request');
var mysql = require('mysql');
var config = require('../config.js');
var forever = require('forever-monitor');
var Mailer = require('./Mailer');
var json2csv = require('json2csv');

var pool = mysql.createPool(config.database);

function Crawler() {
	var self = this;
	self.mailer = new Mailer();
	self._workers = [];
}

Crawler.prototype.sendToQueue = function(urls, concurrency, delay, jobId) {
	var self = this;
	var promise = Q.defer();

	// create workers and dynamic queue
	// var uniQ = self.generateUuid(jobId);
	var q = config.rabbitmq.queues.simple + jobId;
	var pos = self._createWorkers(q, concurrency);

	setTimeout(function() {
		promise.resolve(pos);
	}, 5000)


	promise.promise.then(function(pos) {
		amqp.connect(config.rabbitmq.url, function(err, conn) {
			conn.createChannel(function(err, ch) {

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
						self._killWorkers(pos);

						console.log('Save to db');
						var obj = [true, jobId];
						pool.query('UPDATE yt_job SET finished=? WHERE cpid=?', obj, function(err, results, fields) {
							if (err) throw err;
							console.log('Updated db');
							console.log('Notify... maybe');
							self.buildCsvReport(jobId);

							setTimeout(function() {
								console.log('Closing connection');
								conn.close();
							}, 500);

						});
					});
				});

			});


		});
	});

};

Crawler.prototype.crawl = function(url, jobId, cb) {
	console.log('Crawling ', url);

	request(url, {timeout: config.server.requestTimeout }, function(error, response, body) {
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

Crawler.prototype._createWorkers = function(q, number) {
	var self = this;
	var currWorks = [];

	for (var i = 0; i < number; i++) {
		var child = new(forever.Monitor)(config.server.path + '/Workers/crawlSimple.js', {
			max: 10,
			silent: true,
			args: [q]
		});

		child.on('exit', function() {
			console.log('crawlSimple.js has exited for q %s', q);
		});

		child.on('stop', function() {
			console.log('crawlSimple.js has stopped for q %s', q);
		});

		child.on('start', function() {
			console.log('crawlSimple.js has started for q %s', q);
		});

		child.on('stdout', function(data) {
			//console.log('crawlSimple.js data', data.toString());
		});

		child.start();

		currWorks.push(child);
	}

	self._workers.push(currWorks);

	return self._workers.length - 1;
};

Crawler.prototype._killWorkers = function(pos) {
	var self = this;
	self._workers[pos].forEach(function(w) {
		console.log('Stopping worker');
		w.stop();
	});
};

Crawler.prototype.buildCsvReport = function(jobId) {
	console.log('Build CSV Report')
	var self = this;

	pool.query('SELECT yt_job.shop,yt_response.url,status,IF(type = \'db\',yt_job.url,type) as type FROM yt_job JOIN yt_response ON yt_job.cpid = yt_response.jobId WHERE yt_response.status > 200 AND yt_job.cpid = ?', [jobId],
		function(err, results, fields) {
			if (err) throw err;

			if (results.length > 0) {
				try {
					var fields = ['url', 'status', 'type'];
					var csv = json2csv({
						data: results,
						fields: fields
					});
					var subject = '[SEO Crawler] Results for ' + results[0].shop + ' (jobid: '+jobId+')';
					var msg = 'Here are the results for job ' + jobId + ' for type ' + results[0].type;
					self.mailer.setAttachment('results_'+jobId+'.csv',csv);
					self.mailer.send(subject,msg,function(err,info){
						if (err) throw err;
						console.log('Report sent by mail with id: ' + info.messageId);
					});
				} catch (err) {
					// Errors are thrown for bad options, or if the data is empty and no fields are provided. 
					// Be sure to provide fields if it is possible that your data array will be empty. 
					console.error(err);
				}
			}

		});


};


module.exports = Crawler;