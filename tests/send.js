#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

var args = process.argv.slice(2);

if (args.length == 0) {
  console.log("Usage: rpc_client.js num");
  process.exit(1);
}

amqp.connect('amqp://localhost', function(err, conn) {
  conn.createChannel(function(err, ch) {
    ch.assertQueue('', {exclusive: true}, function(err, q) {
      var corr = generateUuid();
      var num = parseInt(args[0]);
      var num2 = num +10;
      var num3 = num -10;

      console.log(' [x] Requesting fib(%d)', num);
      console.log(' [x] Requesting fib(%d)', num2);
      console.log(' [x] Requesting fib(%d)', num3);

      ch.consume(q.queue, function(msg) {
        if (msg.properties.correlationId == corr) {
          console.log(' [.] Got %s', msg.content.toString());
          //setTimeout(function() { conn.close(); process.exit(0) }, 10000);
        }
      }, {noAck: true});

      ch.sendToQueue('rpc_queue',
      new Buffer(num.toString()),
      { correlationId: corr, replyTo: q.queue });

      ch.sendToQueue('rpc_queue',
      new Buffer(num2.toString()),
      { correlationId: corr, replyTo: q.queue });

      ch.sendToQueue('rpc_queue',
      new Buffer(num3.toString()),
      { correlationId: corr, replyTo: q.queue });

    });
  });
});

function generateUuid() {
  return Math.random().toString() +
         Math.random().toString() +
         Math.random().toString();
}