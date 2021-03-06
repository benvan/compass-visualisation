var SCREEN_WIDTH = window.innerWidth,
SCREEN_HEIGHT = window.innerHeight,

mouseX = 0, mouseY = 0,

windowHalfX = window.innerWidth / 2,
windowHalfY = window.innerHeight / 2,

SEPARATION = 200,
AMOUNTX = 10,
AMOUNTY = 10,

cur=0,
max=100,
lines=[],
axes={},

camera, scene, renderer;

init();
animate();

var xy = makePlot(0,1);
var zx = makePlot(2,0);
var zy = makePlot(2,1);
zy.model = xy.model = zx.model;

var Datum = function(axis){
  this.value = 0;
  this.scaled = 0;
  this.update = function(num){
    this.value = num;
    var c = xy.model.range.center[axis];
    var r = xy.model.range.radius;
    var da = (num - c)/r;
    var neg = da < 0 ? -1 : 1;
    this.scaled = neg*(Math.min(Math.abs(da), 1)*500);
  }
};

var Sensor = function(input){
  this.x = new Datum(0);
  this.y = new Datum(1);
  this.z = new Datum(2);
  this.update = function(data){
    this.x.update(data[0]);
    this.y.update(data[1]);
    this.z.update(data[2]);
  }
};

var System = function(){
  this.m = new Sensor();
  this.a = new Sensor();
  this.g = new Sensor();
  this.update = function(packet, then){
    if (packet[0] == '#'){ // data packet
      var target = packet[1].toLowerCase();
      if (this[target]){
        var data = packet.slice(5).split(',');
        this[target].update(data);
        then();
      } else console.log('unrecognised packet: ' + packet);
    }
  }
};

var system = new System();

function updateData(msg){
  system.update(msg, function(){
    xy.plot(system.m.x.value, system.m.y.value);
    zx.plot(system.m.z.value, system.m.x.value);
    zy.plot(system.m.z.value, system.m.y.value);

    updateLine(lines[cur]);
    axes.update();
    cur++;
    cur %= lines.length;  
  });
}

function updateLine(line){

    line.p.position.x = system.m.x.scaled;
    line.p.position.y = system.m.y.scaled;
    line.p.position.z = system.m.z.scaled;

    line.p.position.normalize();
    line.p.position.multiplyScalar( 515 );

    line.update();
    
}



function init() {

  var container, separation = 100, amountX = 50, amountY = 50, particle;

  container = document.getElementById('viewport');
  //document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera( 75, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 10000 );
  camera.position.z = 1000;

  scene = new THREE.Scene();

  renderer = new THREE.CanvasRenderer();
  renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
  renderer.setFaceCulling( false );
  container.appendChild( renderer.domElement );

  // lines

  var PI2 = Math.PI * 2;
  var material = new THREE.ParticleCanvasMaterial( {

    color: 0xffffff,
    program: function ( context ) {

      context.beginPath();
      context.arc( 0, 0, 3, 0, PI2, true );
      context.closePath();
      context.fill();

    }

  } );

  

  var CompassLine = function(){
    this.p = new THREE.Particle(material);
    this.p2;
    this.material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1 } );
    this.geometry = new THREE.Geometry();
    this.v1 = new THREE.Vector3(0,0,0);
    this.v2 = this.v1.clone();

    this.geometry.vertices.push(this.v1);
    this.geometry.vertices.push(this.v2);
    
    this.line = new THREE.Line(this.geometry,this.material);
    
    this.addToScene = function(){
      scene.add( this.line );
      scene.add( this.p );
    }
    this.bind = function(p2){
      this.p2 = p2;
    }
    this.update = function(){
      var p = this.p, q = this.p2;
      this.v1.set(p.position.x,p.position.y,p.position.z);
      this.v2.set(q.position.x,q.position.y,q.position.z);
      this.material.opacity = 1;
    }
    this.hide = function(){
      this.material.opacity = 0;
    }

  }

  function generateData(){
    var data = [];
    var prev;
    for (var i = 0; i < max; i++){
      var line = new CompassLine();
      line.bind(prev);
      prev = line.p;
      data.push(line);
      line.addToScene();
    }
    data[0].bind(data[data.length-1].p);
    return data;
  }

  var makeAxes = function(){
    var o = new THREE.Vector3(0,0,0);
    var z = new THREE.Vector3(0,0,1);
    var y = new THREE.Vector3(0,1,0);
    var x = new THREE.Vector3(1,0,0);
    
    var h = new THREE.Vector3(0,0,0);


    var Axis = function(vector){
      var axis = vector.clone();
      this.position = function(x,y,z){ vector.set(x,y,z); vector.setLength(500);  };
      this.update = function(scalar){
        vector.x = Math.abs(axis.x);
        vector.y = Math.abs(axis.y);
        vector.z = Math.abs(axis.z);
        vector.setLength(scalar);
      }
    };

    var makeAxis = function(v, color){
      var geometry = new THREE.Geometry();
      geometry.vertices.push(o);
      geometry.vertices.push(v);
      var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( {
        color: color || (v.x && 0xff0000) | (v.y && 0x00ff00) | (v.z && 0x0000ff)
      } ) );
      scene.add(line);
      return new Axis(v);
    };



    return {
      x:makeAxis(x),
      y:makeAxis(y),
      z:makeAxis(z),
      h:makeAxis(h,0xffffff),
      update:function(){
        this.x.update(system.m.x.scaled);
        this.y.update(system.m.y.scaled);
        this.z.update(system.m.z.scaled);
        this.h.position(system.m.x.value, system.m.y.value, system.m.z.value);
      }
    };
  };

  lines = generateData(material);

  axes = makeAxes();

  var frontWireframeMaterial = new THREE.MeshBasicMaterial( {
    color:0x444444,
    wireframe: true,
    transparent: true,
    side: THREE.FrontSide
  } ); 
  var backWireframeMaterial = new THREE.MeshBasicMaterial( {
    color:0x151515,
    wireframe: true,
    transparent: true,
    side: THREE.BackSide
  } ); 
  var sphere = THREE.SceneUtils.createMultiMaterialObject( 
    new THREE.SphereGeometry( 500, 32, 16 ), 
    [frontWireframeMaterial,backWireframeMaterial]
  );

  scene.add( sphere );
  

  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  document.addEventListener( 'touchstart', onDocumentTouchStart, false );
  document.addEventListener( 'touchmove', onDocumentTouchMove, false );

  //

  window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function onDocumentMouseMove(event) {

  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;

}

function onDocumentTouchStart( event ) {

  if ( event.touches.length > 1 ) {

    event.preventDefault();

    mouseX = event.touches[ 0 ].pageX - windowHalfX;
    mouseY = event.touches[ 0 ].pageY - windowHalfY;

  }

}

function onDocumentTouchMove( event ) {

  if ( event.touches.length == 1 ) {

    event.preventDefault();

    mouseX = event.touches[ 0 ].pageX - windowHalfX;
    mouseY = event.touches[ 0 ].pageY - windowHalfY;

  }

}

//

function animate() {

  requestAnimationFrame( animate );

  render();

}

function render() {

  camera.position.x += ( 3*mouseX - camera.position.x );
  camera.position.y += ( - 3*mouseY + 200 - camera.position.y );
  camera.lookAt( scene.position );

  renderer.render( scene, camera );

}
