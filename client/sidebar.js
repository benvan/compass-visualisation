var makePlot = function(axis1, axis2){



	var calibration = {
		// this comes straight from the visualisation - hence the lack of formatting
		model: {"scale":8,"cur":["188.00","404.00","610.00\r"],"range":{"center":[124,268,148],"radius":561.7116698093427}},
		plot: function(x,y){
			var scale = this.model.scale;
			px = half + Math.round((x/scale)+0.5)-0.5;
			py = half + Math.round((y/scale)+0.5)-0.5;
			g.fillStyle = "#ccc";
			g.fillRect(px,py, 1,1);

			this.model.cur[axis1] = x;
			this.model.cur[axis2] = y;
			redraw();
		}
	};

	function toPx(x){
		return (x/calibration.model.scale)+half;
	}

	function fromPx(x){
		return (x-half)*calibration.model.scale;
	}

	// setup drag-to-calibrate
	var cx, cy, down = false, inside = false;

	var container = document.getElementById("graphs");
	var size = container.offsetHeight / 3;
	var half = Math.floor(size / 2)+0.5;

	var graph = document.createElement("div");
	graph.className = "graph";
	graph.style.position = "relative";
	container.style.width = graph.style.width = graph.style.height = size + "px";
	container.appendChild(graph);

	var canvii = [null,null];
	var i = 2;
	while (i --> 0){
		var el = document.createElement("canvas");
		el.width = el.height = size;
		graph.appendChild(el);
		canvii[i] = el;
	}
	var o = canvii[0];
	var c = canvii[1];


	var g = c.getContext("2d");
	g.beginPath();
	g.lineWidth = 1;
	g.strokeStyle = "#999";
	g.moveTo(half,0);
	g.lineTo(half,size);
	g.moveTo(0,half);
	g.lineTo(size,half);
	g.arc(half,half,half-15,0,2*Math.PI);
	g.stroke();
	g.closePath();

	var og = o.getContext("2d");
	og.fillStyle = "#f00";
	og.strokeStyle = '#a33';

	var redraw = function(){
		var model = calibration.model;
		// draw calibration circle
		og.clearRect(0,0,size,size);
		og.beginPath();
		
		og.lineWidth = 2;
		og.arc(
			toPx(model.range.center[axis1]),
			toPx(model.range.center[axis2]),
			model.range.radius/model.scale,0,Math.PI*2
		);
		og.closePath();
		og.stroke();
		og.fillRect(
			toPx(model.cur[axis1]),
			toPx(model.cur[axis2]),
			3,3
		);

	};

	graph.onmousemove = function(ev){
		var model = calibration.model;
		cx = ev.offsetX;
		cy = ev.offsetY;
		
		if (down){
			if (inside){
				model.range.center[axis1] = fromPx(cx);
				model.range.center[axis2] = fromPx(cy);
			}else{
				var dx = fromPx(cx) - model.range.center[axis1],
					dy = fromPx(cy) - model.range.center[axis2],
					r  = Math.sqrt(dx*dx + dy*dy);
				model.range.radius = r;
			}
		}
		redraw();
	};

	graph.onmousedown = function(ev){
		var model = calibration.model;
		down = true;
		var c = model.range.center;
		var dx = fromPx(cx) - c[axis1],
			dy = fromPx(cy) - c[axis2];
		inside = Math.sqrt(dx*dx + dy*dy) < model.range.radius;
	};

	graph.onmouseup = function(ev){
		down = false;
	};


	return calibration;

}

