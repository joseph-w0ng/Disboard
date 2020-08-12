'use strict';

(function () {

  var socket = io();
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  var clear = document.getElementById('clear');
  var room_namefield = document.getElementById('room name');
  var user_namefield = document.getElementById('name');
  var createroom = document.getElementById('createOption');
  var joinroom = document.getElementById('joinOption');
  var joinbutton = document.getElementById('enterRoom');
  var errortxt = document.getElementById('errorMsg');
  var context = canvas.getContext('2d');
  var rect = canvas.getBoundingClientRect();
  var firstload = true;
  var doubletouch = false;
  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
  // canvas.addEventListener('touchstart', onMouseDown, false);
  canvas.addEventListener('touchend', onMouseUp, false);
  canvas.addEventListener('touchcancel', onMouseUp, false);
  canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1 && !doubletouch) {
      onMouseUp(e);
      doubletouch = true;
      let ev = new TouchEvent('touchstart', {touches: [e.touches[0]], changedTouches: [e.touches[0]], targetTouches: [e.touches[0]], view: window});
      canvas.dispatchEvent(ev);
      ev = new TouchEvent('touchstart', {touches: e.touches, changedTouches: e.touches, targetTouches: e.touches, view: window});
      canvas.dispatchEvent(ev);
    } else if (doubletouch) {
      onMouseUp(e);
    } else {
      e.preventDefault();
      onMouseDown(e);
    }
  }, false);
  canvas.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      doubletouch = false;
    }
    onMouseUp(e);
  }, false);

  for (var i = 0; i < colors.length; i++) {
    colors[i].addEventListener('click', onColorUpdate, false);
  }
  clear.addEventListener('click', onClear, false);
  createroom.addEventListener('click', onRoomCreate, false);

  socket.on('join', onJoinEvent);
  socket.on('drawing', onDrawingEvent);
  socket.on('clear', onClearUpdate);
  socket.on('list room options', updateRoomSelect);

  window.addEventListener('load', onLoad, false);
  window.addEventListener('resize', onResize, false);
  onResize();

  function updateOffset() {
    rect = canvas.getBoundingClientRect();
    offx = rect.left;
    offy = rect.top;
  }

  function drawLine(x0, y0, x1, y1, color, emit) {
    if (color == 'white') {
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

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    });
  }

  function onMouseDown(e) {
    drawing = true;
    current.x = (e.clientX || e.touches[0].clientX) - offx;
    current.y = (e.clientY || e.touches[0].clientY) - offy;
  }

  function onMouseUp(e) {
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, (e.clientX || e.touches[0].clientX) - offx, (e.clientY || e.touches[0].clientY) - offy, current.color, true);
  }

  function onMouseMove(e) {
    if (!drawing) { return; }
    drawLine(current.x, current.y, (e.clientX || e.touches[0].clientX) - offx, (e.clientY || e.touches[0].clientY) - offy, current.color, true);
    current.x = (e.clientX || e.touches[0].clientX) - offx;
    current.y = (e.clientY || e.touches[0].clientY) - offy;
  }

  function onColorUpdate(e) {
    current.color = e.target.className.split(' ')[1];
  }

  function onClear(e) {
    onClearUpdate(true);
  }

  function onClearUpdate(emit) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!emit) { return; }
    socket.emit('clear', {});
  }

  function updateRoomSelect(data) {
    joinroom.innerHTML = '';
    for (let room in data) {
      joinroom.innerHTML += '<option value="' + room + '">' + data[room].room_name + '</option>';
    }
    if(joinroom.options.length == 0) {
      joinbutton.hidden = true;
      joinroom.hidden = true;
      document.getElementById('roomslabel').innerHTML = 'no active rooms';
    } else {
      joinbutton.hidden = false;
      joinroom.hidden = false;
      document.getElementById('roomslabel').innerHTML = 'active rooms:';
    }
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function () {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onJoinEvent(data) {
    let details = document.getElementById('room details');
    let buttons = document.getElementById('buttons');
    buttons.hidden = true;
    details.hidden = false;
    details.innerHTML = 'In room: ' + data.room_name + ', name: ' + data.username;
    details.innerHTML += '<button id="leave">Leave room</button>';
    document.getElementById('leave').addEventListener('click',(e) => {
      socket.emit('leave', {
        roomID: sessionStorage.roomID
      });
      sessionStorage.roomID = null;
      sessionStorage.username = null;
      buttons.hidden = false;
      details.hidden = true;
      onClearUpdate();
    }, false);
    updateOffset();
    onClearUpdate();
  }

  function dec2hex(dec) {
    return dec < 10
      ? '0' + String(dec)
      : dec.toString(16);
  }

  // generateId :: Integer -> String
  function generateId(len) {
    var arr = new Uint8Array((len || 40) / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, dec2hex).join('');
  }

  async function onRoomCreate(e) {
    if (!room_namefield.value || !user_namefield.value) { 
      errortxt.innerHTML = 'Please fill in both your name and room name.';
      updateOffset();
      setTimeout(() => {errortxt.innerHTML = ''; updateOffset();}, 2000);
      return;
    }
    if (await checkname(room_namefield.value)) {
      errortxt.innerHTML = 'Error: room name taken';
      updateOffset();
      setTimeout(() => {errortxt.innerHTML = ''; updateOffset();}, 2000);
      return;
    }
    let id = generateId();
    socket.emit('create', {
      room_name: room_namefield.value,
      roomID: id,
      username: user_namefield.value
    });
    sessionStorage.roomID = id;
    sessionStorage.username = user_namefield.value;
  }

  async function checkname(name) {
    // let url = 'http://localhost:3000/checkname';
    let url = 'https://hackthis-whiteboard.herokuapp.com/checkname';
    let res = await fetch(url, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({name:name})
    }).then(
      response => response.json() // .json(), etc.
      // same as function(response) {return response.text();}
    )
    console.log(res.result);
    return res.result;
  }

  joinbutton.addEventListener('click', onRoomJoin, false);

  function onRoomJoin(e) {
    if (!user_namefield.value || joinroom.options.length == 0) {
      errortxt.innerHTML = 'Please fill in your name.';
      updateOffset();
      setTimeout(() => {errortxt.innerHTML = ''; updateOffset();}, 2000);
      console.log(joinroom);
      return;
    }
    let id = joinroom.options[joinroom.selectedIndex].value;
    socket.emit('load', {
      roomID: id,
      username: user_namefield.value
    });
    sessionStorage.roomID = id;
    sessionStorage.username = user_namefield.value;
  }

  function onDrawingEvent(data) {
    var w = canvas.width;
    var h = canvas.height;

    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }

  function onLoad() {
    console.log(sessionStorage);
    // firstload = true;
    socket.emit('load', {
      roomID: sessionStorage.roomID,
      username: sessionStorage.username
    });
  }

  // make the canvas fill its parent
  function onResize() {
    updateOffset();
    if (firstload) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      firstload = false;
      return;
    }
    if (isMobile) {
      return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    socket.emit('resize', {});
  }

})();