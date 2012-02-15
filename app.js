var http = require('http');
var amqp = require('amqp');
var URL = require('url');
var fs = require('fs');
var io = require('socket.io');

function rabbitUrl() {  
    return "amqp://127.0.0.1";
}

var httpserver = http.createServer(handler);
var socketioserver = io.listen(httpserver);

var port = 8083; //process.env.VCAP_APP_PORT || 3000;

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
          queue.subscribe(function(message, headers, deliveryInfo)  {
              publisher.publish(message);
          });
          queue.bind(exchange.name, '');
      });
      queue.on('queueBindOk', function() { console.log(exchange); });
  });
  console.log("Set up complete!");
}

socketioserver.sockets.on('connection', function (connection) {

    publisher.publish = function (msg) {
        console.log(msg);
        //connection.send(msg.data.toString());
        socketioserver.sockets.in(msg.sessionId).send(msg.foo);
    };

//    socket.get('sessionId', function (err, name) {
//        console.log('message for ', name);
//    });

    // connection.on('set nickname', function (name) {
    var sessionId = generateUUID(); //connection.handshake.sessionID; 
//    connection.set('sessionId', sessionId, function () {
       console.log('Setting sessionId: ' + sessionId);
        connection.emit('sessionId', sessionId);
        connection.send('ready');
//    });

    connection.join(sessionId);

    // });


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

httpserver.listen(port);

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}