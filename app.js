var http = require('http');
var amqp = require('amqp');
var URL = require('url');
var fs = require('fs');
var io = require('socket.io');

function rabbitUrl() {  
    return "amqp://172.16.134.128";
}

var httpserver = http.createServer(handler);
var socketioserver = io.listen(httpserver);

var port = process.env.VCAP_APP_PORT || 3000;

var messages = [];
var exchange = {};

var publisher = {
    publish: function(){}
}

function setup() {
  console.log("Setting Up!");
  exchange = conn.exchange('System:String', {'type': 'fanout', durable: true}, function() {

      var queue = conn.queue('', {durable: true, exclusive: true},
      function() {
          console.log("Joined Queue");
          queue.subscribe(function(msg) {
              publisher.publish(msg);
          });
          queue.bind(exchange.name, '');
      });
      queue.on('queueBindOk', function() { console.log(exchange); });
  });
  console.log("Set up complete!");
}

socketioserver.sockets.on('connection', function(connection) {
      publisher.publish = function(msg){
          console.log(msg);
          connection.send(msg)
      };
});

console.log("Starting ... AMQP URL: " + rabbitUrl());
var conn = amqp.createConnection({url: rabbitUrl()});
conn.on('ready', setup);
console.log("Connection Setup");

function handler(req, res) {
  var path = URL.parse(req.url).pathname;
  fs.readFile(__dirname + '/index.html', function(err, data){
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data, 'utf8');
      res.end();
    });  
}

httpserver.listen(8081);
