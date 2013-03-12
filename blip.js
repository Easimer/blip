var running = true;
var now;
if (window.performance && window.performance.now) {
  now = function() { return window.performance.now(); };
} else {
  now = function() { return new Date().getTime(); };
}

var nextFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function(callback) {
      setTimeout(callback, 1000 / 60);
    };

var canvas = $('#blipchart')[0];
canvas.width = 1000;
canvas.height = 200;
var ctx = canvas.getContext('2d');
var xofs = 50;
var delay = 10;
var range = 1000;
var log_range = Math.log(range * 1.5);
var current_x = 0;
var blips = [];

var msec_to_y = function(msecs) {
  return canvas.height - (Math.log(msecs) * canvas.height / log_range);
}

var addBlip = function(color, url) {
  blips.push({color: color, url: url});
}

var gotBlip = function(color, url, x, startTime) {
  var endTime = now();
  var msecs = endTime - startTime;
  var y = msec_to_y(msecs);
  if (msecs >= range) {
    ctx.setFillColor('#f00');
    ctx.fillRect(x - 2, y - 1, 3, 4);
  }
  ctx.setFillColor(color);
  ctx.fillRect(x - 1, y - 2, 2, 4);
  addBlip(color, url);
}

var startBlips = function() {
  while (blips.length) {
    var blip = blips.shift();
    var createResult = function(blip) {
      var startTime = now();
      var result = function() {
	gotBlip(blip.color, blip.url, current_x + xofs, startTime);
      }
      return result;
    }
    var result = createResult(blip);
    $.ajax({
      'url': blip.url,
      crossDomain: false,
      success: result,
      error: result,
      timeout: range
    });
  }
};

var lastTick = now();
var gotTick = function() {
  var t = now();
  if (running) {
    if (t - lastTick >= delay) {
      startBlips();
      var x_inc = parseInt((t - lastTick)/delay);
      var new_x = (current_x + x_inc) % (canvas.width - xofs);
      ctx.setFillColor('rgba(128,128,128,1.0)');
      ctx.fillRect(current_x + xofs + 4, 0, x_inc, canvas.height);
      ctx.setFillColor('rgba(255,255,255,1.0)');
      ctx.fillRect(current_x + xofs, 0, x_inc + 1, canvas.height);
      lastTick = t;
      current_x = new_x;
    }
    nextFrame(gotTick);
  }
}

var toggleBlip = function() {
  if (running) {
    running = 0;
  } else {
    running = 1;
    lastTick = now();
    nextFrame(gotTick);
  }
}

var labels = [ 2, 5, 10, 20, 50, 100, 200, 500, 1000 ];
ctx.setFillColor('black');
ctx.textBaseline = 'middle';
ctx.textAlign = 'right';
ctx.scale(3, 1);
ctx.font = '8px Arial';
for (var i = 0; i < labels.length; i++) {
  var msecs = labels[i];
  ctx.fillText(msecs, (xofs - 5) / 3, msec_to_y(msecs));
}
ctx.scale(1/3, 1);

//addBlip('rgba(255,0,0,0.8)', 'http://8.8.8.8:53/blip');
addBlip('rgba(0,255,0,0.8)', 'http://gstatic.com/generate_204');
addBlip('rgba(0,0,255,0.8)', 'http://apenwarr.ca/blip/');
nextFrame(gotTick);

