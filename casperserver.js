// functions
function getLinks() {
  var links = document.querySelectorAll('h3.r a');
  return Array.prototype.map.call(links, function(e) {
    return e.getAttribute('href')
  });
}

//define ip and port to web service
var ip_server = '127.0.0.1:8585';

//includes web server modules
var server = require('webserver').create();

//start web server
var service = server.listen(ip_server, function(request, response) {
  var casper = require('casper').create();
  var url = '';
  var status = null;
  if (request.method == 'POST') {
    url = request.post.address;
    console.log(request.postRaw);
    casper.start(url);

    casper.then(function() {
      this.echo('Crawl Page: ' + this.getTitle());
      var stats = this.status(false);
      this.echo('Status Code: ' + stats.currentHTTPStatus);
      status = stats.currentHTTPStatus;
    });

    casper.run(function() {
      response.statusCode = 200;

      //sends results as JSON object
      response.write(JSON.stringify({
        'status': status,
        'url': url
      }));

      response.close();
    });

  }else{
    response.close();
  }

  



});
console.log('Casper Server running at http://' + ip_server + '/');