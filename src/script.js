var fcanvas;
var bgImg;
var bgImEl;

var imgs;
var imIdx;
var isLoading = false;
var isPlaying = false;

var curSelData = null;
var curSelRid = -1;

var maxGid = 0,
    maxRid = 0,
    maxAid = 0;

function init() {
  $.getJSON("data/imgs.json", function(data) {
    imgs = data.frames; imIdx = 0;

    // canvas
    var canvas = document.getElementById("imCanvas");
    canvas.width = $("#divCont").width();
    canvas.height = $("#divCont").height();
    fcanvas = new fabric.Canvas(canvas);
    fcanvas.selection = false; // disable group (multiple) selection
    fcanvas.uniScaleTransform = true;

    fcanvas.on('mouse:up', function(e) {

    });

    initCanvas();
    setTimeout(initCanvas, 3000);


    // callbacks
    $("#divCont").keypress(processKeys);
    $("#divCont").focus();


    $("#playBtn").click(onPlayBtn);
    $("#backBtn").click(onBackBtn);
    $("#fwdBtn").click(onFwdBtn);
    $("#aAddBtn").click(onAAddBtn);
    $("#aEditBtn").click(onAEditBtn);
    $("#aTBeginBtn").click(onATBeginBtn);
    $("#aTEndBtn").click(onATEndBtn);
    $("#aTContinueBtn").click(onATContinueBtn);
    $("#aTLocConstraintBtn").click(onATConstraintBtn);

    $("#aiDelBtn").click(onAiDelBtn);
    $("#aiGotoBtn").click(onAiGotoBtn);
    $("#aTDelBtn").click(onATDelBtn);
  
    $("#curFrameEdit").numeric({
      allowMinus: false,
      allowThouSep: false,
      allowDecSep: false,
      min: 0
    });
    $("#playSkip").numeric({
      allowThouSep: false,
      allowDecSep: false,
    });

    $("#saveBtn").click(onSaveBtn);

    $("#aTSelect").val("0");

    grps = [];
    $('#aGrpTblDiv').html( '<table cellpadding="0" cellspacing="0" border="0" class="display compact" id="aGrpTbl"></table>' );
    $("#aGrpTbl").DataTable({ 
      data: grps,
      columns: [{"title": "Name" }],
      columnDefs: [
        {
          "targets": [0],
          "searchable": false,
          "visible": false,
          "sTitle": 'gid'
        },
        {
          "targets": [1],
          "visible": true,
          "searchable": true,
          "sTitle": 'Name'
        },
        {
          "targets": [2],
          "visible": true,
          "searchable": false,
          "sTitle": 'Color'
        }
      ],
      dom: 'T<"clear">lfrtip',
      paging: false,
      bInfo: false,
      order: [0, 'desc'],
      tableTools: {
        sSwfPath: "src/tables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
        sRowSelect: "os",
        sRowSelector: 'td:first-child',
        aButtons: []
      }
    });

    $('#aRngTblDiv').html( '<table cellpadding="0" cellspacing="0" border="0" class="display compact" id="aRngTbl"></table>' );
    $("#aRngTbl").DataTable({ 
      data: [],
      columnDefs: [
        {
          "targets": [0],   // rid
          "searchable": false,
          "visible": false,
          "sTitle": "rid"
        },
        {
          "targets": [1],   // gid
          "visible": false,
          "searchable": false 
        },
        {
          "targets": [2],   // tid
          "visible": false,
          "searchable": false
        },
        {
          "targets": [3],   // Name 
          "visible": true,
          "searchable": true, 
          "sTitle": "Name",
          "width": "50%"
        },
        {
          "targets": [4],   // Type 
          "visible": true,
          "searchable": true,
          "sTitle": "Type"
        },
        {
          "targets": [5],   // Begin Frame 
          "visible": true,
          "searchable": true,
          "sTitle": "Begin"
        },
        {
          "targets": [6],   // End Frame 
          "visible": true,
          "searchable": true,
          "sTitle": "End"
        },
        {
          "targets": [7],   // AnnotationRange
          "visible": false,
          "searchable": false,
          "sTitle": "Obj"
        }
      ],
      dom: 'T<"clear">lfrtip',
      paging: false,
      bInfo: false,
      order: [0, 'desc'],
      tableTools: {
        sSwfPath: "src/tables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
        sRowSelect: "os",
        sRowSelector: 'td:first-child',
        aButtons: []
      }
    });

    $('#aInstTblDiv').html( '<table cellpadding="0" cellspacing="0" border="0" class="display compact" id="aInstTbl"></table>' );
    $("#aInstTbl").DataTable({ 
      data: [],
      columnDefs: [
        {
          "targets": [0],   // aid 
          "searchable": false,
          "visible": false
        },
        {
          "targets": [1],   // rid
          "searchable": false,
          "visible": false
        },
        {
          "targets": [2],   // Name 
          "visible": true,
          "searchable": true, 
          "sTitle": "Name"
        },
        {
          "targets": [3],   // Type 
          "visible": true,
          "searchable": true,
          "sTitle": "Type"
        },
        {
          "targets": [4],   // Frame 
          "visible": true,
          "searchable": true,
          "sTitle": "Frame"
        }
      ],
      dom: 'T<"clear">lfrtip',
      paging: false,
      bInfo: false,
      order: [0, 'desc'],
      tableTools: {
        sSwfPath: "src/tables/extensions/TableTools/swf/copy_csv_xls_pdf.swf",
        sRowSelect: "os",
        sRowSelector: 'td:first-child',
        aButtons: []
      }
    });

    $(".accordion").accordion({
      collapsible: true,
      active: false,
    });
    $(".accordion").accordion({clearStyle: true, autoHeight: false});

    $("#showTooltipsCheck").prop("checked", false); // default to false
    $("#showTooltipsCheck").click( function() {
      handleTooltips( $("#showTooltipsCheck").prop("checked") );
    });
    handleTooltips($("#showTooltipsCheck").prop("checked"));

    $("#editNewAnnoGrpCheck").prop("checked", true);

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

    // load state
    // var f = '1432666368.json';
    // loadStateFromServer(f);
    // loadStateFromServer('1433211675.json');
    loadStateFromServer('latest');

  });
}

function handleTooltips(doShow) {
  if (doShow) {
    $("#playBtn").tooltip({
      content:"Play video, skipping +/- frames according to the Frame Skip value.",
      items:"#playBtn"
    });
    $("#backBtn").tooltip({
      content:"Go back according to Frame Skip value.",
      items:"#backBtn"
    });
    $("#fwdBtn").tooltip({
      content:"Go forward according to Frame Skip value.",
      items: "#fwdBtn"
    });
    $("#aAddBtn").tooltip({
      content:"Add an Annotation Group (e.g. person, object, group).",
      items:"#aAddBtn"
    });
    $("#aEditBtn").tooltip({
      content:"Edit an Annotation Group's name/color; must have an Annotation Group row selected.",
      items: "#aEditBtn"
    });
    $("#aTBeginBtn").tooltip({
      content:"Begin an Annotation Range; must have an Annotation Group row and an Annotation Type selected.",
      items: "#aTBeginBtn"
    });
    $("#aTContinueBtn").tooltip({
      content:"Resume editing of an Annotation Range; must have an Annotation Range row selected.",
      items:"#aTContinueBtn"
    });
    $("#aTEndBtn").tooltip({
      content: "End editing of an Annotation Range.",
      items: "#aTEndBtn"
    });
    $("#aTSelect").tooltip({
      content: "Select an Annotation Type.",
      items: "#aTSelect"
    });
    $("#aTDelBtn").tooltip({
      content: "Delete one or more Annotation Ranges and all their Instances. Must 1+ Annotation Range rows selected.",
      items: "#aTDelBtn"
    });
    $("#aTLocConstraintBtn").tooltip({
      content: "Set default location of an Annotation Range based on the location of another.",
      items: "#aTLocConstraintBtn"
    });
    $("#aiDelBtn").tooltip({
      content: "Delete an Annotation Instance from an Annotation Range. Requires 1+ Annotation Instance rows to be selected.",
      items: "#aiDelBtn"
    });
    $("#aiGotoBtn").tooltip({
      content: "Seek video to the frame that contains a given Annotation Instance. Requires an Annotation Instance row to be selceted.",
      items: "#aiGotoBtn"
    });
    $("#curFrameEdit").tooltip({
      content: "Current video frame, can type in specific frames to seek to.",
      items: "#curFrameEdit"
    });
    $("#playSkip").tooltip({
      content: "Frame Skip value, # of frames to skip when going forward / backward / playing. can be +/- .",
      items: "#playSkip",
    });
  } 

  else {
    $("#playBtn").tooltip({
      content:"",
      items:""
    });
    $("#backBtn").tooltip({
      content:"",
      items:""
    });
    $("#fwdBtn").tooltip({
      content:"",
      items: ""
    });
    $("#aAddBtn").tooltip({
      content:"",
      items:""
    });
    $("#aEditBtn").tooltip({
      content:"",
      items: ""
    });
    $("#aTBeginBtn").tooltip({
      content:"",
      items: ""
    });
    $("#aTContinueBtn").tooltip({
      content:"",
      items:""
    });
    $("#aTEndBtn").tooltip({
      content: "",
      items: ""
    });
    $("#aTSelect").tooltip({
      content: "",
      items: ""
    });
    $("#aTDelBtn").tooltip({
      content: "",
      items: ""
    });
    $("#aTLocConstraintBtn").tooltip({
      content: "",
      items: ""
    });
    $("#aiDelBtn").tooltip({
      content: "",
      items: ""
    });
    $("#aiGotoBtn").tooltip({
      content: "",
      items: ""
    });
    $("#curFrameEdit").tooltip({
      content: "",
      items: ""
    });
    $("#playSkip").tooltip({
      content: "",
      items: "",
    });
  }
}

function initCanvas() {
  imPath = imgs[imIdx];
  bgImEl = $('<img src="' + imPath + '">').get(0);
  bgImg = new fabric.Image(bgImEl, {left: 0, top: 0});
  fcanvas.setBackgroundImage(bgImg);

  bgImEl.addEventListener("load", function() {
    var drawFcn = function() {
      drawAnnotations(imIdx, false);
      fcanvas.renderAll();
      isLoading = false;
    }
    if (isPlaying) drawFcn();
    else window.requestAnimationFrame(drawFcn);
  })

  setImage(imIdx);
}

function drawAnnotations(frame, doRender) {
  var allData = $("#aRngTbl").DataTable().columns(7).data();
  allData[0].forEach( function(aRng, idx, arr) {
    aRng.drawReadable(fcanvas, imIdx);
  });
  rid = curSelRid; obj = curSelData;
  if (curSelRid != -1) {
    curSelData.drawEditable(fcanvas, imIdx, function() {
      curSelRid = rid;
      curSelData = obj;
    });
  }
  if (doRender) fcanvas.renderAll();
}


function pad (str, max) {
  return str.length < max ? pad("0" + str, max) : str;
}

function addGroupAnnotationUi() {
  // todo: make alpha value user-settable
  color = randomColor(0.6);

  var grpTable = $("#aGrpTbl").DataTable();
  var gid = maxGid + 1;
  name = "Annotation-" + pad( gid.toString(), 3 );

  if ($("#editNewAnnoGrpCheck").prop("checked")) {
    var hcolor = rgbaStrToHexStr(color);

    $("#grpColorInput").val(hcolor);
    $("#grpNameInput").val(name);
    $("grpNameInput").select();

    $("#grpEditDialog").dialog({ 
      modal: true,
      buttons: {
        Ok: function() {
          var newName = $("#grpNameInput").val(),
              newColor = $("#grpColorInput").val();

          if (newName.length == 0) {
            console.log('cannot have empty name');
            return;
          }

          if ( newName === name && newColor === hcolor ) {
            $(this).dialog("close");
            return;
          }
          
          // update grpTbl row, rngTbl entries, relevant annotation range objs
          color = hexStrToRgbaStr(newColor);
          name = newName;
          $(this).dialog("close");

          grpTable.row.add( [maxGid, name, color] ).draw();
          colorizeGrpTbl();
          $(".accordion").accordion("refresh");
          maxGid = gid;
        },
        Cancel: function() {
          $(this).dialog("close");
        }
      }
    });
  } else {
    grpTable.row.add( [maxGid, name, color] ).draw();
    colorizeGrpTbl();
    $(".accordion").accordion("refresh");
    maxGid = gid;
  }
}

function randomColor(alpha) {
  r = Math.round(Math.random() * 255);
  g = Math.round(Math.random() * 255);
  b = Math.round(Math.random() * 255);
  a = alpha;

  return 'rgba('+r+','+g+','+b+','+a+')';
}

function randomRect() {
  x = Math.random() * 320; y = Math.random() * 240;
  w = 30+Math.random() * 180; h = 30+Math.random() * 140;
  r = Math.round(Math.random() * 255);
  g = Math.round(Math.random() * 255);
  b = Math.round(Math.random() * 255);
  a = 0.6;

  r = createRect('rgba('+r+','+g+','+b+','+a+')', x, y, w, h);
  return r;
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

// todo: call obj method to update its size/loc once ranges/handlers are ready
function relativeResize(obj, dl, dt, dx, dy) {
if (!obj) return;
obj.set('width', obj.get('width') + dx);
obj.set('height', obj.get('height') + dy);
obj.set('top', obj.get('top') + dt);
obj.set('left', obj.get('left') + dl);
obj.setCoords();
fcanvas.renderAll();
}

function setImage(idx) {
  imPath = imgs[idx];
  bgImEl.src = imgs[idx];
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

function onAAddBtn(evt) {
  addGroupAnnotationUi();
}

function removeCurrentEditable() {
  if (curSelRid == -1) return;

  var extantRow = $("#aRngTbl").DataTable().row( function(idx, data, node) {
    if (data[0] == curSelRid) return true;
    else return false;
  });
  if (extantRow.length == 1) {
    d = extantRow.data();
    rngObj = extantRow.data()[7];
    rngObj.deleteEditable(fcanvas);
  }
  curSelRid = -1;
}


function onATBeginBtn(evt) {
  var rows = $("#aGrpTbl").DataTable().rows('.selected').data();
  if (rows.length == 0) return;
  removeCurrentEditable();

  var row = rows[0];
  var name = row[1],
      color = row[2],
      gid = row[0];

  var rid = maxRid + 1,
      type = $("#aTSelect option:selected").text(),
      begin = -1,
      end = -1;

  tid = parseInt($("#aTSelect").val())
  if (tid == 0)      var data = new RectangleRange({fill: color}, rid);
  else if (tid == 1) var data = new PointRange({fill: color}, rid);
  else if (tid == 2) var data = new GroupRange({fill: color}, rid);
  else if (tid == 3) var data = new AngleRange({fill: color}, rid);

  rngRow = [rid, gid, tid, name, type, begin, end, data];
  maxRid = rid;

  $("#aRngTbl").DataTable().row.add(rngRow).draw();
  colorizeRngTbl();

  $(".accordion").accordion("refresh");

  data.drawEditable(fcanvas, imIdx, function() {
    curSelRid = rid;
    curSelData = data;
  });

  // data.drawEditable(fcanvas, imIdx, function() {
  //   curSelRid = rid;
  //   curSelData = data;
  // });
}
// function selectCb() {
//   curSelRid = rid;
//   curSelData = data;
// }

function processKeys(evt) {
  evt.key = String.fromCharCode(evt.keyCode);
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
  // else if ((evt.key == 'r' || evt.key == 'R') && evt.shiftKey) {
  else if (evt.key == 'r' || evt.key == 'R') {
    // reverse playback direction
    var playSkipEl = $("#playSkip");
    var playSkipVal = parseInt(playSkipEl.val());
    playSkipEl.val(-playSkipVal);
  }

  // var obj = fcanvas.getActiveObject();
  // if (!obj) return;
  var obj = null;

  var v = 1; var bigMult = 20;
  var val = evt.shiftKey? v*bigMult : v;

  if (evt.key == 't' || evt.key == 'T') {
    imIdx = Math.max(0, Math.min( imIdx + parseInt($("#playSkip").val()), imgs.length-1 ));
    setImage(imIdx);
  }

  if (evt.key == 'a' || evt.key == 'A') relativeResize(obj, -val, 0, 0, 0);
  else if (evt.key == 'd' || evt.key == 'D') relativeResize(obj, val, 0, 0, 0);
  else if (evt.key == 'w' || evt.key == 'W') relativeResize(obj, 0, -val, 0, 0);
  else if (evt.key == 's' || evt.key == 'S') relativeResize(obj, 0, val, 0, 0);
  else if (evt.key == 'l' || evt.key == 'L') relativeResize(obj, 0, 0, val, 0);
  else if (evt.key == 'j' || evt.key == 'J') relativeResize(obj, 0, 0, -val, 0);
  else if (evt.key == 'k' || evt.key == 'K') relativeResize(obj, 0, 0, 0, -val);
  else if (evt.key == 'i' || evt.key == 'I') relativeResize(obj, 0, 0, 0, val);
  else if (evt.keyCode == 46) {} // delete annotation
  else if (evt.key == 'f' || evt.key == 'F') {
    commitAnnotation();
  }

  else if (evt.key == 'p' || evt.key == 'P') {
    initCanvas();
  }
  else {} //console.dir(evt);
}

function commitAnnotation() {
  if (curSelRid == -1) return;

  // get RangeAnnotation for curSelRid 
  var aRow = $("#aRngTbl").DataTable().row( function(idx, data, node) {
    if (data[0] == curSelRid) return true;
    else return false;
  });
  data = $("#aRngTbl").DataTable().row(aRow[0]).data();
  obj = data[7]; frame = imIdx;

  // commit change
  var res = obj.commit(frame);
  if (!res) return;

  // todo: think about how to handle redundant group entries (should only have 2)
  // hmm, how to handle GroupRange, which should only have 1/2 entries?

  // add to annotation table
  var aid = maxAid + 1,
      rid = data[0],
      name = data[3],
      type = data[4],
      rngTbl = $("#aRngTbl").DataTable(),
      instTbl = $("#aInstTbl").DataTable();
  var row = [aid, rid, name, type, frame];

  // if there is an annotation with this (rid, frame), then replace it
  var extantRow = $("#aInstTbl").DataTable().row( function(idx, data, node) {
    if (data[1] == rid && data[4] == frame) return true;
    else return false;
  } );
  if (extantRow.length == 1) { // update row
    extantRow.data(row);
    instTbl.draw();
    drawAnnotations(frame, true);
    return;
  }
  $("#aInstTbl").DataTable().row.add(row).draw();
  maxAid = aid;

  // update begin/end frame in rngTbl
  rng = obj.range();
  data[5] = rng[0]; data[6] = rng[1];
  $("#aRngTbl").DataTable().row(aRow[0]).data(data);
  drawAnnotations(frame, true);
}

function onATContinueBtn() {
  var rows = $("#aRngTbl").DataTable().rows('.selected').data();
  if (rows.length == 0) return;
  if (rows.length > 1) return; // todo: use first, deselect other rows
  data = rows[0]; rid = data[0]; 
  if (curSelRid == rid) return;
  removeCurrentEditable();

  gid = data[1]; obj = data[7];
  var gRow = $("#aGrpTbl").DataTable().row( function(idx, data, node) {
    if (data[0] == gid) return true;
    else return false;
  });
  color = $("#aGrpTbl").DataTable().row(gRow[0]).data()[2];
  obj.drawEditable(fcanvas, imIdx, function() {
    curSelRid = rid;
    curSelData = data[7];
  });
}

function onATEndBtn() {
  removeCurrentEditable();
  saveStateToTimestampedFile();
}

function hexStrToRgbaStr(s) {
  var r = parseInt(s.slice(1,3), 16).toString(),
      g = parseInt(s.slice(3,5), 16).toString(),
      b = parseInt(s.slice(5,7), 16).toString(),
      a = "0.6";
  return 'rgba('+r+','+g+','+b+','+a+')';
}

// note, this ignores the alpha component
function rgbaStrToHexStr(s) {
  var rgb = s.split(',');
  var r = parseInt(rgb[0].split('(')[1]).toString(16);
  var g = parseInt( rgb[1] ).toString(16);
  var b = parseInt( rgb[2] ).toString(16);
  if (r.length==1) r = '0'+r;
  if (g.length==1) g = '0'+g;
  if (b.length==1) b = '0'+b;
  return '#'+r+g+b;
}

function onAEditBtn() {
  // get currently selected Annotation Group row
  var rows = $("#aGrpTbl").DataTable().rows('.selected').data();
  if (rows.length == 0) return;
  row = rows[0];

  var color = rgbaStrToHexStr(row[2]), 
      name = row[1],
      gid = row[0];
  $("#grpColorInput").val(color);
  $("#grpNameInput").val(name);
  $("grpNameInput").select();

  $("#grpEditDialog").dialog({ 
    modal: true,
    buttons: {
      Ok: function() {
        var newName = $("#grpNameInput").val(),
            newColor = $("#grpColorInput").val();

        if (newName.length == 0) {
          console.log('cannot have empty name');
          return;
        }

        if ( newName === name && newColor === color ) {
          $(this).dialog("close");
          return;
        }

        // update grpTbl row, rngTbl entries, relevant annotation range objs
        var newRgbaStr = hexStrToRgbaStr(newColor);
        var newRow = row;
        newRow[1] = newName; newRow[2] = newRgbaStr;
        $("#aGrpTbl").DataTable().row('.selected').data(newRow).draw();
        colorizeGrpTbl();
        colorizeRngTbl();
        // colorizeInstTbl();


        $("#aRngTbl").DataTable().rows().every( function() {
          var data = this.data();
          if (data[1] != gid) return;

          var obj = data[7];
          obj.setStyle( {fill: newRgbaStr} );

          var newRngRow = data;
          newRngRow[3] = newName;
          this.data(newRngRow);

          // todo: specially redraw editable here so curSelData is valid?
          // between now and next frame draw, or are we ok?
          obj.deleteReadable(fcanvas);
          obj.deleteEditable(fcanvas);

          var rid = data[0];
          $("#aInstTbl").DataTable().rows().every( function() {
            var _data = this.data();
            if (_data[1] != rid) return;
            var newInstRow = _data;
            newInstRow[2] = newName;
            this.data(newInstRow);
          });
        });
        drawAnnotations(imIdx, true);
        $(this).dialog("close");
      },
      Cancel: function() {
        $(this).dialog("close");
      }
    }
  });
}

function colorizeGrpTbl() {
  $("#aGrpTbl").DataTable().rows( function(idx, data, node) {
    $(":last-child", node).css("background-color", data[2]);
  });
}

function colorizeRngTbl() {
  $("#aRngTbl").DataTable().rows( function(idx, data, node) {
    gid = data[1];
    color = '';

    $("#aGrpTbl").DataTable().row( function(_idx, _data, _node) {
      if (_data[0] == gid) color = _data[2];
    });
    $(":first-child", node).css("background-color", color);
  });
}

function onAiDelBtn() {
  // get rid, rngObj from selection, update rngObj, rngTbl, instTbl, redraw frame
  $("#aInstTbl").DataTable().rows('.selected').every( function() {
    var data = this.data();
    var rid = data[1]; var frame = data[4];

    // uncommit changes from underlying AnnotationRange objects
    $("#aRngTbl").DataTable().row( function(_idx,_data,_node) {
      if (_data[0] != rid) return;
      rngObj = _data[7];
      rngObj.uncommit(frame);
    });
  });
  $("#aInstTbl").DataTable().rows('.selected').remove().draw();

  // update begin/end frames of #aRngTbl
  $("#aRngTbl").DataTable().rows( function(idx,data,node) {
    newRngRow = data; rng = data[7].range();
    newRngRow[5] = rng[0]; newRngRow[6] = rng[1];
    $("#aRngTbl").DataTable().row(data).data(newRngRow);
  });

  var allData = $("#aRngTbl").DataTable().columns(7).data();
  allData[0].forEach( function(aRng, idx, arr) {
    aRng.drawReadable(fcanvas, imIdx);
  });
}

function onAiGotoBtn() {
  $("#aInstTbl").DataTable().row('.selected').every( function() {
    frame = this.data()[4];
    setImage(frame);
  });
}

function onATDelBtn() {
  $("#aRngTbl").DataTable().rows('.selected').every( function() {
    data = this.data();
    rid = data[0]; obj = data[7];

    // remove all instTbl rows with rid
    $("#aInstTbl").DataTable().rows(function(idx, _data, node) {
      if (_data[1] == rid) return true;
      else return false;
    }).remove();

    // todo: handle curSelData?
    obj.deleteEditable(fcanvas);
    obj.deleteReadable(fcanvas);

  }).remove().draw();

  $("#aInstTbl").DataTable().rows().draw();
}

function onSaveBtn() {
  saveStateToTimestampedFile();
}

function saveStateToTimestampedFile() {
  // serialized = {
  //  .gids[{}]
  //       .gid
  //       .name
  //       .color
  //       .rids[{}]
  //            .rid: int
  //            .tid: int
  //            .obj = {
  //                .data: [[]]
  //                .range: [beginFrame, endFrame]
  //                .type: '...'
  //                .version: '...'
  //            }
  //  .dataset
  //          .nFrames: int
  //          .name: '...'
  // }
  // collect all grpTbl, rngTbl rows according to above
  // into above form, then JSON-ify and send to server 
  
  s = {gids: [], tids: [], dataset: {nFrames: imgs.length, name: ''}};
  $("#aGrpTbl").DataTable().rows().every(function() {
    var gRow = this.data();
    gidData = {gid: gRow[0], name: gRow[1], color: gRow[2], rids: []};
    
    $("#aRngTbl").DataTable().rows().every(function() {
      var rRow = this.data();
      if (rRow[1] != gidData.gid) return;
      ridData = {rid: rRow[0], tid: rRow[2], data: rRow[7].serializable()};
      gidData.rids.push(ridData);
    });

    s.gids.push(gidData);
  });

  // var jsonArray = JSON.parse(JSON.stringify(rng))
  var jsonStr = JSON.stringify(s);
  
  $.ajax({
    type: 'POST',
    url: 'saveFile.php',
    data: {'data': jsonStr},
    success: function(msg) {
      console.log('Saved!');
    }
  });
}

function loadStateFromServer(fname) {
  // get json from server
  $.post(
      "loadFile.php",
      {'fname': fname},
      function(data) {
        if (!data.gids || !data.dataset) {
          console.log('Data returned, but is not correctly formatted; cannot load it');
          return; 
        }

        var grpTable = $("#aGrpTbl").DataTable(),
            rngTable = $("#aRngTbl").DataTable(),
            instTable = $("#aInstTbl").DataTable();
        
        data.gids.forEach(function(x, idx, arr) {
          maxGid = maxGid + 1;
          grpTable.row.add( [x.gid, x.name, x.color] );
          x.rids.forEach(function(y, _idx, _arr) {
            var obj = null;
            if (y.data.type === 'Rect') obj = new RectangleRange({fill: x.color}, y.rid).fromSerializable(y.data);
            else if (y.data.type === 'Point') obj = new PointRange({fill: x.color}, y.rid).fromSerializable(y.data);
            else if (y.data.type === 'Group') obj = new GroupRange({fill: x.color}, y.rid).fromSerializable(y.data);
            if (obj == null) {
              console.log('Warning: unsupported annotation type: ' + y.data.type + ', skipping.');
              return;
            }
            maxRid = maxRid + 1;
            rngTable.row.add([y.rid, x.gid, y.tid, x.name, y.data.type, y.data.range[0], y.data.range[1], obj]);
            y.data.mask.forEach(function(z, _idx, _arr) {
              maxAid = maxAid + 1;
              instTable.row.add( [maxAid, y.rid, x.name, y.data.type, z] );
            });
          });
        });

        // hack for updating GroupEvent objects since they have
        // references to other objects
        // todo: handle obj refs when ranges get deleted
        var allData = $("#aRngTbl").DataTable().columns(7).data()[0];
        for (var i=0;i<allData.length;i++) {
          if (allData[i].getType() === 'Group') {
            allData[i].updateObjRefs();
          }
        }


        grpTable.rows().draw();
        rngTable.rows().draw();
        instTable.rows().draw();
        colorizeGrpTbl();
        colorizeRngTbl();
        $(".accordion").accordion("refresh");
        drawAnnotations(imIdx, true);

        // check rids
        var allData = $("#aRngTbl").DataTable().columns(0).data()[0];
        maxRid = Lazy(allData).max() + 1;
      });
}

function onATConstraintBtn() {
  var rng1 = null;

  var handler = function() {
    rows = $("#aRngTbl").DataTable().rows('.selected').data();
    if (rows.length != 1) return;

    if (!rng1) { // set rng1 and do popup 
      rng1 = rows[0][7];

      $("#constraintsDialog2").dialog({
        modal: true,
        buttons: {
          Ok: function() {
            // $("#aRngTbl tbody").on('click', 'tr', handler);
            $(this).dialog("close");
          },
          Cancel: function() {
            $(this).dialog("close");
          }
        }
      });
    } else {
      var rng2 = rows[0][7];
      rng1.setLocationHint(rng2.loc);
      $("#aRngTbl tbody").unbind('click', handler);
      
      $("#constraintsDialog3").dialog({
        modal: true,
        buttons: {Ok: function() {$(this).dialog("close");}}
      });
      
    }
  }

  // first dialog popup 
  $("#constraintsDialog1").dialog({
    modal: true,
    buttons: {
      Ok: function() {
        $("#aRngTbl tbody").on('click', 'tr', handler);
        $(this).dialog("close");
      },
      Cancel: function() {
        $(this).dialog("close");
      }
    }
  });
}
