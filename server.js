var restify = require('restify');
var amqp = require('amqplib/callback_api');

function respond(req, res, next) {
	res.send('hello ' + req.params.name);
	next();
}

var server = restify.createServer();
var client = restify.createStringClient({
	url: 'http://127.0.0.1:8585'
});

server.get('/hello/:name', respond);
server.head('/hello/:name', respond);

server.get('/crawl', function(req, res, next) {
	client.post('/', {
		address: 'https://www.cochemania.mx/'
	}, function(err, rq, rs, obj) {
		console.log(obj);
		res.send(JSON.parse(obj), 200);
		next();
	});
});

server.get('/crawlSitemap', function(req, res, next) {
	var data = {
		id : Date.now(),
		started : false
	};
	amqp.connect('amqp://localhost', function(err, conn) {
		conn.createChannel(function(err, ch) {
			var q = 'sitemap-crawl';
			data.msg = 'Starting sitemap crawl'
			data.sitemapUrl = 'https://www.cochemania.mx/export/google/sitemap.xml'
			data.started = true;

			ch.assertQueue(q, {
				durable: false
			});
			// Note: on Node 6 Buffer.from(msg) should be used
			ch.sendToQueue(q, new Buffer(JSON.stringify(data)));
			console.log(" [x] Start job sitemap");

		});
		setTimeout(function() {
			conn.close();
			res.send(data, 200);
		next();
		}, 1000);
	});
});



server.listen(9090, function() {
	console.log('%s listening at %s', server.name, server.url);
});