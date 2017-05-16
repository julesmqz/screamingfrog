#!/usr/bin/env node

var amqp = require('amqplib/callback_api');
var request = require('request');

amqp.connect('amqp://localhost', function(err, conn) {
	conn.createChannel(function(err, ch) {
		var q = 'rpc_queue';

		ch.assertQueue(q, {
			durable: false
		});
		ch.prefetch(1);
		console.log(' [x] Awaiting RPC requests');
		ch.consume(q, function reply(msg) {
			var n = parseInt(msg.content.toString());

			console.log(" [.] fib(%d)", n);

			// var r = fibonacci(n);

			request('https://www.cochemania.mx', function(error, response, body) {
				if (error) throw error;
				// console.log('error:', error); // Print the error if one occurred
				// console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received

				
				setTimeout(function(){

					ch.sendToQueue(msg.properties.replyTo,
					new Buffer(response.statusCode.toString()), {
						correlationId: msg.properties.correlationId
					});
					ch.ack(msg);	
				},1000);
				

			});
		});
	});
});

function fibonacci(n) {
	if (n == 0 || n == 1)
		return n;
	else
		return fibonacci(n - 1) + fibonacci(n - 2);
}