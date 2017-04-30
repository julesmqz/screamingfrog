var restify = require('restify');

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



server.listen(8080, function() {
	console.log('%s listening at %s', server.name, server.url);
});