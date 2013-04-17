var sys = require('sys')
  , spawn = require('child_process').spawn
  , express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , serial = require('serialport')
  ;

io.set('log level',2);

server.listen(8000);

app.use(express.static(__dirname + "/client"));

spawn('ardreado',[]);
var port = new serial.SerialPort('/dev/ttyACM0', { 
    baudrate: 9600
  , parser : serial.parsers.readline('\n')
}, false);


io.sockets.on('connection', function (socket) {
  var run = function(){
    port.on('data', function(data){
      // console.log(data.toString());
      socket.send(data.toString());
    });
  };
  var running = true;
  socket.on('toggle', function(){
    if (running){
      port.close();
    }else{
      port.open(run);
    }
    running = !running;
    
  });
  port.open(run);
});
