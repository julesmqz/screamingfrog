var request = require('request');
var url = 'https://www.abasteo.mx/_clone2/repositories/julio/Fabricante/DELL/'

request(url, {
	timeout: 100000
}, function(error, response, body) {
	if (error) throw error;
	console.log('COOL, cache should be created');
}).auth('clone', 'clone', true);