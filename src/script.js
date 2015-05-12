var fcanvas;
var bgImg;
var bgImEl;

var imgs;
var imIdx;
var isLoading = false;
var isPlaying = false;

function init() {
  $.getJSON("k2_01000.json", function(data) {
    imgs = data.frames;
    imIdx = 0;

    // callbacks
    $(":root").keypress(processKeys);
    $("#playBtn").click(onPlayBtn);
    $("#backBtn").click(onBackBtn);
    $("#fwdBtn").click(onFwdBtn);

    var frameRng = $("#frameRng");

    frameRng.change(function(e) {setImage($("#frameRng").val()-1);});
    frameRng.prop({
      'min': 1,
      'max': imgs.length,
      'val': 1,
    });
    $("#nFrameEdit").val(imgs.length-1);
    $("#nFrameEdit").prop("disabled", true);

    $("#curFrameEdit").change(function(e) {
      oldIdx = imIdx;
      idx = Math.max(0, Math.min( parseInt($("#curFrameEdit").val()), imgs.length-1 ));
      if (isNaN(idx)) { 
        idx = oldIdx;
        $("#nFrameEdit").val(idx);
        return;
      }
      setImage(idx);
    });

    // canvas
    var canvas = document.getElementById("imCanvas");
    canvas.width = $("#divCont").width();
    canvas.height = $("#divCont").height();

    fcanvas = new fabric.Canvas(canvas);
    r1 = createRect('rgba(0, 255, 0, 0.4', 100, 100, 50, 100);
    r2 = createRect('rgba(0, 0, 255, 0.4', 200, 100, 50, 100);

    // initialize bgImg
    imPath = imgs[imIdx];
    bgImEl = $('<img src="' + imPath + '">').get(0);
    bgImg = new fabric.Image(bgImEl, {left: 0, top: 0});
    fcanvas.setBackgroundImage(bgImg);

    bgImEl.addEventListener("load", function() {
      fcanvas.renderAll();
      isLoading = false;
    });

    setImage(imIdx);
    fcanvas.uniScaleTransform = true;
    fcanvas.add(r1); fcanvas.add(r2);
  });
}

function createRect(cstr, left, top, width, height) {
  var rect = new fabric.Rect({
    'fill': cstr,
    'width': width, 'height': height,
    'left': left, 'top': top,
    'lockRotation': true
  });
  rect.setControlsVisibility({mtr: false});
  return rect;
}

function relativeResize(obj, dl, dt, dx, dy) {
  obj.set('width', obj.get('width') + dx);
  obj.set('height', obj.get('height') + dy);
  obj.set('top', obj.get('top') + dt);
  obj.set('left', obj.get('left') + dl);
  fcanvas.renderAll();
}

function setImage(idx) {
  imPath = imgs[idx];
  bgImEl.src = imgs[idx];
  // $("#curFrameEdit").val(idx+1);
  // $("#frameRng").prop('value', idx+1);
  $("#curFrameEdit").val(idx);
  $("#frameRng").prop('value', idx);

  imIdx = idx;
}

function playVideo(doPlay) {
  if (doPlay) {
    var play = function() {
      if (!isPlaying) return;

      if (isLoading) {
        window.requestAnimationFrame(play);
        return;
      } 
      isLoading = true;

      oldIdx = imIdx;
      imIdx = Math.max(0, Math.min( imIdx + parseInt($("#playSkip").val()), imgs.length-1 ));
      if (imIdx == oldIdx) {  // stop playing
        btn.textContent = "Play";
        isPlaying = false;
        isLoading = false;
        playVideo(false);
        return;
      }

      setImage(imIdx);
      window.requestAnimationFrame(play);
    }
    window.requestAnimationFrame(play);
  }
}

function onFwdBtn(evt) {
  mod = evt.shiftKey? 30 : 1;
  imIdx += mod;
  imIdx = Math.max(0, Math.min(imIdx, imgs.length-1));
  setImage(imIdx);
}

function onBackBtn(evt) {
  mod = evt.shiftKey? 30 : 1;
  imIdx -= mod;
  imIdx = Math.max(0, Math.min(imIdx, imgs.length-1));
  setImage(imIdx);
}

function onPlayBtn(evt) {
  btn = $("#playBtn")[0];
  if (btn.textContent === "Play") {
    btn.textContent = "Pause";
    isPlaying = true;
    playVideo(true);
  }
  else {
    btn.textContent = "Play";
    isPlaying = false;
    playVideo(false);
  }
}

function processKeys(evt) {
  if (evt.key == 'g' || evt.key == 'G') {
    btn = $("#playBtn")[0];
    if (!isPlaying) {
      btn.textContent = "Pause";
      isPlaying = true;
      playVideo(true);
    }
    else {
      btn.textContent = "Play";
      isPlaying = false;
      playVideo(false);
    }
  }
  else if ((evt.key == 'r' || evt.key == 'R') && evt.shiftKey) {
    // reverse playback direction
    var playSkipEl = $("#playSkip");
    var playSkipVal = parseInt(playSkipEl.val());
    playSkipEl.val(-playSkipVal);
  }

  var obj = fcanvas.getActiveObject();
  if (!obj) return;

  var v = 1; var bigMult = 10;
  var val = evt.shiftKey? v*bigMult : v;

  if (evt.key == 'a' || evt.key == 'A') relativeResize(obj, -val, 0, 0, 0);
  else if (evt.key == 'd' || evt.key == 'D') relativeResize(obj, val, 0, 0, 0);
  else if (evt.key == 'w' || evt.key == 'W') relativeResize(obj, 0, -val, 0, 0);
  else if (evt.key == 's' || evt.key == 'S') relativeResize(obj, 0, val, 0, 0);
  else if (evt.keyCode == 39) relativeResize(obj, 0, 0, val, 0);
  else if (evt.keyCode == 37) relativeResize(obj, 0, 0, -val, 0);
  else if (evt.keyCode == 38) relativeResize(obj, 0, 0, 0, -val);
  else if (evt.keyCode == 40) relativeResize(obj, 0, 0, 0, val);
  else if (evt.keyCode == 46) {} // delete annotation
  else if (evt.keyCode == ' ') console.log("commit annotation");
  else console.dir(evt);
}
