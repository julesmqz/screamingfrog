var casper = require('casper').create();
var url = 'https://clone:clone@www.abasteo.mx/_clone2/repositories/julio/'
casper.start(url);

casper.then(function() {
    this.echo('First Page: ' + this.getTitle());
});

casper.run();