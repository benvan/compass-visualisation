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
}

var Model = function(input){
  this.x = new Datum(0);
  this.y = new Datum(1);
  this.z = new Datum(2);
  this.update = function(data){
    this.x.update(data[0]);
    this.y.update(data[1]);
    this.z.update(data[2]);
  }
}

var model = new Model([0,0,0]);

function updateData(data){
  if (data.length == 3){
    model.update(data);

    xy.plot(model.x.value, model.y.value);
    zx.plot(model.z.value, model.x.value);
    zy.plot(model.z.value, model.y.value);

    updateLine(lines[cur]);
    cur++;
    cur %= lines.length;
  }
  
}

function updateLine(line){

    line.p.position.x = model.x.scaled;
    line.p.position.y = model.y.scaled;
    line.p.position.z = model.z.scaled;

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

  lines = generateData(material);

  var frontWireframeMaterial = new THREE.MeshBasicMaterial( {
    color:0x666666,
    wireframe: true,
    transparent: true,
    side: THREE.FrontSide
  } ); 
  var backWireframeMaterial = new THREE.MeshBasicMaterial( {
    color:0x222222,
    wireframe: true,
    transparent: true,
    side: THREE.BackSide
  } ); 
  var sphere = THREE.SceneUtils.createMultiMaterialObject( 
    new THREE.SphereGeometry( 500, 32, 16 ), 
    [frontWireframeMaterial,backWireframeMaterial]
  );

  scene.add( sphere );
  
  for (var i = 0; i < 0; i++) {

    var geometry = new THREE.Geometry();

    var vertex = new THREE.Vector3( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
    vertex.normalize();
    vertex.multiplyScalar( 450 );

    geometry.vertices.push( vertex );

    var vertex2 = vertex.clone();
    vertex2.multiplyScalar( Math.random() * 0.3 + 1 );

    geometry.vertices.push( vertex2 );

    var line = new THREE.Line( geometry, new THREE.LineBasicMaterial( { color: 0xffffff, opacity: Math.random() } ) );
    scene.add( line );
  }

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

  camera.position.x += ( mouseX - camera.position.x );
  camera.position.y += ( - mouseY + 200 - camera.position.y );
  camera.lookAt( scene.position );

  renderer.render( scene, camera );

}
