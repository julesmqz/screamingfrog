var amqp = require('amqplib/callback_api');
var Q = require('q');
var config = require('../config.js');
var forever = require('forever-monitor');

function RabbitMqClass() {
	var self = this;
	self._workers = {};
}

RabbitMqClass.prototype.send = function(q, data, cbSend, cbResponse) {
	var self = this;
	amqp.connect(config.rabbitmq.url, function(err, conn) {
		conn.createChannel(function(err, ch) {

			ch.assertQueue('', {
				exclusive: true
			}, function(err, q2) {
				var corr = self.generateUuid();
				//console.log('corr number', corr);
				ch.consume(q2.queue, function(msg) {
					var data2 = JSON.parse(msg.content.toString());
					if (msg.properties.correlationId == corr) {
						console.log(' [.] Got response');
						cbResponse.apply(null, [data2,conn]);
					}
				}, {
					noAck: true
				});

				// Note: on Node 6 Buffer.from(msg) should be used
				ch.sendToQueue(q, new Buffer(JSON.stringify(data)), {
					correlationId: corr,
					replyTo: q2.queue
				});
				console.log(" [x] Start job with ACK");
				cbSend.apply(null, [corr]);
			});

		});

	});


};

RabbitMqClass.prototype.listen = function(q, cbResponse) {
	var self = this;
	amqp.connect(config.rabbitmq.url, function(err, conn) {
		conn.createChannel(function(err, ch) {
			ch.assertQueue(q, {
				durable: false,
				autoDelete: true
			});
			ch.prefetch(1);
			console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);


			ch.consume(q, function reply(msg) {
				console.log(" [x] Received %s", msg.content.toString());
				var data = JSON.parse(msg.content.toString());
				cbResponse.apply(null, [data, {channel: ch, message: msg,conn: conn}]);
			});
		});
	});
};

RabbitMqClass.prototype.ACK = function(data, channel, msg) {
	channel.sendToQueue(msg.properties.replyTo,
		new Buffer(JSON.stringify(data)), {
			correlationId: msg.properties.correlationId
		});
	channel.ack(msg);
	console.log('ACK success', data);
};

RabbitMqClass.prototype.close = function(conn, delay) {
	delay = parseInt(delay) || 1000
	setTimeout(function() {
		conn.close();
		console.log('Connection closed');
	}, delay);
};


RabbitMqClass.prototype.generateUuid = function() {
	return Date.now().toString();
};

RabbitMqClass.prototype.createWorkers = function(workerPath,q, number,jobId) {
	var self = this;
	var currWorks = [];
	var workerFile = config.server.path + workerPath;
	for (var i = 0; i < number; i++) {
		var child = new(forever.Monitor)(workerFile, {
			max: 10,
			silent: true,
			args: [q]
		});

		child.on('exit', function() {
			console.log(workerFile + ' has exited for q %s', q);
		});

		child.on('stop', function() {
			console.log(workerFile + ' has stopped for q %s', q);
		});

		child.on('start', function() {
			console.log(workerFile + ' has started for q %s', q);
		});

		child.on('stdout', function(data) {
			console.log(workerFile + ' data', data.toString());
		});

		child.start();

		currWorks.push(child);
	}

	self._workers[jobId] = currWorks;
};

RabbitMqClass.prototype.killWorkers = function(jobId) {
	var self = this;
	self._workers[jobId].forEach(function(w) {
		console.log('Stopping worker');
		w.stop();
	});
};

module.exports = RabbitMqClass;