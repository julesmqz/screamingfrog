var RQC = require('../Classes/RabbitMqClass');
var config = require('../config');

var rabbit = new RQC();
var q = config.rabbitmq.queues.specific;
rabbit.listen(q, function(data, res) {
	console.log('Gonna Crawl %s for the %s time', data.url, data.tickNr);

	setTimeout(function() {
		var data2 = {
			response: 200,
			tickNr: data.tickNr
		};

		rabbit.ACK(data2, res.channel, res.message);
	}, 10000);

});