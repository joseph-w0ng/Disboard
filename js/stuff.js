'use strict';

(function() {

  var socket = io();
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  var clear = document.getElementById('clear');
  var context = canvas.getContext('2d');
  var rect = canvas.getBoundingClientRect();
  var load = true;

  var offx = rect.left;
  var offy = rect.top;

  var current = {
    color: 'black'
  };
  var drawing = false;

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
  
  //Touch support for mobile devices
  canvas.addEventListener('touchstart', onMouseDown, false);
  canvas.addEventListener('touchend', onMouseUp, false);
  canvas.addEventListener('touchcancel', onMouseUp, false);
  canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

  for (var i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }
  clear.addEventListener('click', onClear, false);

  socket.on('drawing', onDrawingEvent);

  socket.on('clear', onClearUpdate);

  window.addEventListener('resize', onResize, false);
  window.addEventListener('load', function(){load = true;console.log('reloaded')}, false);
  onResize();


  function drawLine(x0, y0, x1, y1, color, emit){
    if(color == 'white') {
        context.clearRect(x0 - 25, y0 - 25, 50, 50);
    } else {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.stroke();
        context.closePath();
    }

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;
    var rect = canvas.getBoundingClientRect();

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    });
  }

  function onMouseDown(e){
    drawing = true;
    current.x = (e.clientX||e.touches[0].clientX) - offx;
    current.y = (e.clientY||e.touches[0].clientY) - offy;
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, (e.clientX||e.touches[0].clientX) - offx, (e.clientY||e.touches[0].clientY) - offy, current.color, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, (e.clientX||e.touches[0].clientX) - offx, (e.clientY||e.touches[0].clientY) - offy, current.color, true);
    current.x = (e.clientX||e.touches[0].clientX) - offx;
    current.y = (e.clientY||e.touches[0].clientY) - offy;
  }

  function onColorUpdate(e){
    current.color = e.target.className.split(' ')[1];
  }

  function onClear(e) {
    onClearUpdate(e, true);
  }

  function onClearUpdate(e, emit) {
    context.clearRect(0,0,canvas.width,canvas.height);
    if(!emit) { return; }
    socket.emit('clear', {});
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
    var rect = canvas.getBoundingClientRect();

    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }

  // make the canvas fill its parent
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // console.log('here');
    if(!load) {
        socket.emit('resize', {});
    } else {
        load = false;
    }
  }

})();