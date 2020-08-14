'use strict';

(function() {

  var socket = io();
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  var clear = document.getElementById('clear');
  var context = canvas.getContext('2d');
  var rect = canvas.getBoundingClientRect();
  var load = true;
  var roomId = null;
  var lineWidth = 2;
  var questions = null; // list of the questions based on the assignment id
  var counter = 0; // counter is the index of the question to display
  var assignmentId = null;

  let offx = rect.x;
  let offy = rect.y;

  var current = {
    color: 'black'
  };
  var drawing = false;

  $('#container').hide();
  $('#roomId').attr('disabled', true);

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
  
  //Touch support for mobile devices
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    onMouseDown(e);
  }, false);
  canvas.addEventListener('touchend', onMouseUp, false);
  canvas.addEventListener('touchcancel', onMouseUp, false);
  canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

  for (var i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  const thicknessElement = document.getElementById('penThickness');
  thicknessElement.innerText = lineWidth;

  clear.addEventListener('click', onClear, false);
  $('#increaseThickness').click(() => {
    lineWidth++;
    thicknessElement.innerText = lineWidth;
  });

  $('#decreaseThickness').click(() => {
    if (lineWidth > 1) {
      lineWidth--;
      thicknessElement.innerText = lineWidth;
    }
  });
  
  socket.on('submitWorkFailed', (data) => {
    $("#submitError").html("Submission failed, please try again");
    $("#submitWork").show();
  });

  socket.on('hideSubmit', () => {
    $('#submitWork').hide();
  });

  socket.on('drawing', onDrawingEvent);
  
  socket.on('roomError', (roomId) => {
    $('#errorMsg').html(roomId + " is not a valid room.");
    $('#errorMsg').css('visibility','visible');
  })
  socket.on('nextQuestion', () => { 
    $("#submitWork").show();
    counter++;
    onClearUpdate(null, true); // clear the board
    if (counter >= questions.length) {
      $("#container").hide();
      $("#intro-wrapper").show();
      counter = 0;
      return;
    }
    $('#questionText').html("Problem:" + questions[counter]); // update the question
  });

  socket.on('clear', onClearUpdate);

  socket.on('roomJoined', (info) => {
    $('#errorMsg').css('visibility','hidden');
    roomId = info.roomId;
    assignmentId = info.assignmentId;
    questions = info.questions["questions"];
    $("#room").html("Room ID: " + roomId);
    $('#questionText').html("Problem: " + questions[counter]); 
    $('#intro-wrapper').hide();
    $('#container').show();
    rect = canvas.getBoundingClientRect();
    offx = rect.x;
    offy = rect.y;
  });

  socket.on('invalidAssignment', (assignmentId) => {
    $('#errorMsg').html(assignmentId + " is not a valid assignment ID.");
    $('#errorMsg').css('visibility','visible');
  });

  window.addEventListener('resize', onResize, false);
  window.addEventListener('load', function(){load = true;console.log('reloaded')}, false);
  onResize();

  function drawLine(x0, y0, x1, y1, color, thickness, emit){
    if(color == 'white') {
        context.clearRect(x0 - 25, y0 - 25, 50, 50);
    } else {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = thickness;
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
      color: color,
      thickness: lineWidth,
      roomId: roomId
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
    drawLine(current.x, current.y, (e.clientX||e.touches[0].clientX) - offx, (e.clientY||e.touches[0].clientY) - offy, current.color, lineWidth, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, (e.clientX||e.touches[0].clientX) - offx, (e.clientY||e.touches[0].clientY) - offy, current.color, lineWidth, true);
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
    socket.emit('clear', {roomId: roomId});
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

    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.thickness);
  }

  function canvasToImage() {
    //cache height and width        
    var w = canvas.width;
    var h = canvas.height;
  
    var data;
  
    //get the current ImageData for the canvas.
    data = context.getImageData(0, 0, w, h);
  
    //store the current globalCompositeOperation
    var compositeOperation = context.globalCompositeOperation;
  
    //set to draw behind current content
    context.globalCompositeOperation = "destination-over";
  
    //set background color
    context.fillStyle = "white";
  
    //draw background / rect on entire canvas
    context.fillRect(0,0,w,h);
  
    //get the image data from the canvas
    var imageData = canvas.toDataURL("image/png");
  
    //clear the canvas
    context.clearRect (0,0,w,h);
  
    //restore it with original / cached ImageData
    context.putImageData(data, 0,0);
  
    //reset the globalCompositeOperation to what it was
    context.globalCompositeOperation = compositeOperation;
  
    //return the Base64 encoded data url string
    return imageData;
  }

  // make the canvas fill its parent
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if(!load) {
        socket.emit('resize', {roomId: roomId});
    } else {
        load = false;
    }
  }

function canvasToImage() {
  //cache height and width        
  var w = canvas.width;
  var h = canvas.height;

  var data;

  //get the current ImageData for the canvas.
  data = context.getImageData(0, 0, w, h);

  //store the current globalCompositeOperation
  var compositeOperation = context.globalCompositeOperation;

  //set to draw behind current content
  context.globalCompositeOperation = "destination-over";

  //set background color
  context.fillStyle = "white";

  //draw background / rect on entire canvas
  context.fillRect(0,0,w,h);

  //get the image data from the canvas
  var imageData = canvas.toDataURL("image/png");

  //clear the canvas
  context.clearRect (0,0,w,h);

  //restore it with original / cached ImageData
  context.putImageData(data, 0,0);

  //reset the globalCompositeOperation to what it was
  context.globalCompositeOperation = compositeOperation;

  //return the Base64 encoded data url string
  return imageData;
}
var createBtn = document.getElementById("createOption");
var addBtn = document.getElementById("joinOption");

  $('#createOption').click( () => {
    $('#roomId').val('');
    $('#roomId').attr('disabled', true);
    $('#assignmentId').attr('disabled', false);

    createBtn.style.backgroundColor = '#2081C3';
    createBtn.style.borderColor = '#2081C3';
    addBtn.style.backgroundColor = '#65b3e6';
    addBtn.style.borderColor = '#65b3e6';

  });

  $('#joinOption').click( () => {
    $('#roomId').attr('disabled', false);
    $('#assignmentId').attr('disabled', true);
    $('#assignmentId').val('');

    addBtn.style.backgroundColor = '#2081C3';
    addBtn.style.borderColor = '#2081C3';
    createBtn.style.backgroundColor = '#65b3e6';
    createBtn.style.borderColor = '#65b3e6';
  });

  $('#submitWork').click(() => {
    let data = canvasToImage();
    let packet = {
      roomId: roomId,
      data: data,
      assignmentId: assignmentId,
      questionNumber: counter + 1
    }
    socket.emit('submitWork', packet);
  });

  $('#enterRoom').click( () => {
    let name = $('#name').val();
    assignmentId = $('#assignmentId').val();

    $('#name').val('');
    $('#assignentId').val('');

    if ($('#roomId').is(':disabled')) {
      let info = {
        name: name,
        assignmentId: assignmentId
      };
      

      socket.emit('create', info);
    }
    else {
      let roomId = $('#roomId').val();
      let info = {
        name: name,
        roomId: roomId,
      };

      socket.emit('join', info);
    }
  });

})();

/* When the user clicks on the button, 
toggle between hiding and showing the dropdown content */
function palletView() {
    console.log("Image Clicked");
    document.getElementById("pallet").classList.toggle("show");
    document.getElementById("overlay").style.display = "block";
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches('#pallet-icon') && !event.target.matches('#pallet')) {
        document.getElementById("overlay").style.display = "none";
        var dropdowns = document.getElementsByClassName("overflow-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}