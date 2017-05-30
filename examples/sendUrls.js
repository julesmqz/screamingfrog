var RQC = require('../Classes/RabbitMqClass');
var config = require('../config');

var rabbit = new RQC();

var nr = 1;
tick(nr);

function tick(nr) {
	console.log('Start tick %s', nr);

	var q = config.rabbitmq.queues.specific;
	var data3 = {
		url: 'http://some-url.com',
		tickNr: nr
	};
	rabbit.send(q, data3, function(corr) {
		console.log('SENT with corr %s', corr);
	}, function(data, conn) {
		console.log('Job answer with data %s for tick %s', data.response, data.tickNr);
	});

	nr++;
	setTimeout(function() {
		tick(nr);
	}, 3000);
}