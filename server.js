var sys = require('sys')
  , spawn = require('child_process').spawn
  , express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

io.set('log level',2);

server.listen(8000);

app.use(express.static(__dirname));

io.sockets.on('connection', function (socket) {
  //var tail = spawn('tail',["-f","/home/ben/foo"]);
  var tail = spawn('ardreado',[]);
  tail.stdout.on('data', function(data){
    socket.send(data.toString('utf-8'));
  });
});
