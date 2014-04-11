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

//spawn('ardreado',[]);
//var device = '/dev/tty.usbmodem1411'
var device = 'pipe'
var port = new serial.SerialPort(device, { 
    baudrate: 57600
  , parser : serial.parsers.readline('\n')
}, false);


io.sockets.on('connection', function (socket) {
  console.log('connected');
  var run = function(){
    console.log('running');
    port.on('data', function(data){
      
      console.log('data');
       console.log(data.toString());
      socket.send(data.toString());
    });
  };
  var running = true;
  socket.on('toggle', function(){
    
       console.log('toggled');
    if (running){
      port.close();
    }else{
      port.open(run);
    }
    running = !running;
    
  });
  socket.on('forward', function(msg){
    port.write(msg);
  });
  port.open(run);

  console.log(port);
});
