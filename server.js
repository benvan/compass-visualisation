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

app.use(express.static(__dirname));

spawn('ardreado',[]);
var port = new serial.SerialPort('/dev/ttyACM0', { 
    baudrate: 9600
  , parser : serial.parsers.readline('\n')
});


io.sockets.on('connection', function (socket) {
  port.on('data', function(data){
    console.log(data.toString());
    socket.send(data.toString('utf-8'));
  });
  //var tail = spawn('tail',["-f","/home/ben/foo"]);
  //var tail = spawn('ardreado',[]);
  //tail.stdout.on('data', function(data){
    //socket.send(data.toString('utf-8'));
  //});
});
