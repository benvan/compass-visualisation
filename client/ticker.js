
var Ticker = function(sensor, colors, interval){

	var opts = {resetBounds: false};
	var x = new TimeSeries(opts);
	var y = new TimeSeries(opts);
	var z = new TimeSeries(opts);

	this.start = function(){
		setInterval(function() {
			x.append(new Date().getTime(), sensor.x.value);
			y.append(new Date().getTime(), sensor.y.value);
			z.append(new Date().getTime(), sensor.z.value);
		}, interval);
	};

	this.attach = function(to){
		var c = document.createElement('canvas');
		c.width = to.offsetWidth;
		c.height = (to.offsetHeight-20) / 3;
		to.appendChild(c);	

		var chart = new SmoothieChart();
		chart.addTimeSeries(x, { strokeStyle: colors[0], lineWidth: 1 });
		chart.addTimeSeries(y, { strokeStyle: colors[1], lineWidth: 1 });
		chart.addTimeSeries(z, { strokeStyle: colors[2], lineWidth: 1 });
		chart.streamTo(c, interval);

		var key = document.createElement('div');
		key.setAttribute('class', 'item');
		key.style.height = c.height+'px';
		colors.forEach(function(c,i){
			var label = document.createElement('i');
			label.style['color'] = c;
			label.innerHTML = 'xyz'[i];
			key.appendChild(label);
		});
		var legend = to.getElementsByClassName('legend')[0];
		legend.appendChild(key);

	};

}
