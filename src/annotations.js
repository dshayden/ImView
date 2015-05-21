
var RectangleRange = function(style, id) {

  // public methods
  this.drawEditable = function(fcanvas, frame, selectCb, style) {
    var isNew = false;
    if (!editObj) {
      cw = fcanvas.width; ch = fcanvas.height;
      rw = cw * 0.1; rh = ch*0.3;

      // left top w h
      curData = [cw*.5 - rw/2, ch*.5 - rh/2, rw, rh];
      curFrme = frame;

      editObj = createRect(fill, curData[0], curData[1], curData[2], curData[3]);
      isNew = true;
      
      editObj.on('selected', function() {
        selectCb();
      });

      editObj.on('modified', function() {
        o = editObj;
        curData = [o.getLeft(), o.getTop(), o.getWidth(), o.getHeight()];
      });
    }

    // handle hints, constraints here
   
    editObj.setCoords();
    if (isNew) fcanvas.add(editObj);
    fcanvas.setActiveObject(editObj);
  };

  this.setStyle = function(style) {
    fill = style.fill;
  }

  this.highlight = function(fcanvas, flag) {
    highlightFlag = flag;
  }

  this.deleteReadable = function(fcanvas) {
    if (!intObj) return;
    fcanvas.remove(intObj);
    intObj = null;
  }

  this.deleteEditable = function(fcanvas) {
    if (!editObj) return;
    fcanvas.remove(editObj);
    editObj = null;
  }

  this.drawReadable = function(fcanvas, frame, style) {
    if (!(beginFrame <= frame && frame <= endFrame)) {
      if (intObj) this.deleteReadable(fcanvas);
      return;
    }
  
    dat = getData(frame);
    if (!intObj) {
      intObj = createRect(fill, dat[0], dat[1], dat[2], dat[3]);
      intObj.fill = '';
      intObj.stroke = fill;
      intObj.strokeWidth = 3;
      intObj.strokeDashArray = ['-', '-'];
      intObj.selectable = false;
      intObj.rngClass = this;
      isNew = true;
      fcanvas.add(intObj);
      fcanvas.sendToBack(intObj);
    }

    if (highlightFlag) intObj.strokeWidth = 10;
    else intObj.strokeWidth = 3;

    intObj.left = dat[0];
    intObj.top = dat[1];
    intObj.width = dat[2];
    intObj.height = dat[3];

    intObj.setCoords();
  }

  // return Array of data for a given frame
  this.data = function(frame) {
    return 
  };                 

  // return Array of mask for a given frame
  this.mask = function(frame) {
    return mask[frmae];
  };

  this.uncommit = function(frame) {
    console.log('rectangeRng uncommit, frame: ' + frame);

    var idx = Lazy(mask).indexOf(frame);
    if (idx == -1) return false;
    
    mask.splice(idx, 1);
    data.splice(idx, 1);

    if (mask.length > 0) {
      beginFrame = Lazy(mask).min();
      endFrame = Lazy(mask).max();
    } else {
      beginFrame = -1;
      endFrame = -1;
    }
    return true;
  }

  // add current data to data/mask
  this.commit = function(frame) {
    if (!curData) return false;
    setData(frame, curData);

    beginFrame = Lazy(mask).min();
    endFrame = Lazy(mask).max();
    return true;
  };

  this.range = function() {return [beginFrame, endFrame];};
  this.isSpatial = function() {return spatial;};
  this.getRid = function() {return rid;};

  // return an object containing all important information,
  // can only contain associative arrays and arrays
  this.serializable = function() {
    var bundle = {data: data,
                  mask: mask,
                  range: this.range(),
                  type: 'Rect',
                  version: '0.1'
                 };
    // var jsonArray = JSON.parse(JSON.stringify(rng))
    // var jsonStr = JSON.stringify(rng);
    return bundle;
  };

  this.fromSerializable = function(bundle) {
    data = bundle.data;
    mask = bundle.mask;
    beginFrame = bundle.range[0];
    endFrame = bundle.range[1];
    return this;
  }


  // private methods
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
 
  // todo: figure out this interpolation issue of adding future then past
  // observations
  function getData(frame) {
    if (endFrame < frame || frame < beginFrame) return;
    var idx = Lazy(mask).indexOf(frame);
    if (idx != -1) return data[idx];

    // else we must interpolate
    var idx = Lazy(mask).sortedIndex(frame);
    arr = [mask[idx-1], mask[idx]];
    val = [data[idx-1], data[idx]];
    
    // (val-min)/(max-min)
    var ratio = (frame-arr[0])/(arr[1]-arr[0]);

    interp = [0,0,0,0];
    for (i=0;i<4;i++) {
      interp[i] = val[0][i]*(1-ratio) + val[1][i]*ratio;
    }

    return interp;
  }

  // add data to list in sorted order
  function setData(frame, dat) {
    if (mask.length == 0) {
      mask.push(frame);
      data.push(dat);
      return;
    }

    // todo: make sure the sort is in the correct direction
    var idx = Lazy(mask).indexOf(frame);
    if (idx == -1) {
      var idx = Lazy(mask).sortedIndex(frame);
      mask.splice(idx, 0, frame);
      console.log(mask);
      data.splice(idx, 0, dat);
      return;
    }
    data[idx] = dat;
  }

  // public properties
  // this.isSpatial = false;

  // private properties
  // var nFrames = numFrames;
  var fill = style.fill;

  var D = 4;
  var data = new Array(0);
  var mask = new Array(0);

  var beginFrame = -1;
  var endFrame = -1;
  var spatial = true;

  var intObj = null;  // objects drawn to canvas
  var editObj = null;

  var curData = null; 
  var curFrame = -1;

  var rid = id;

  var highlightFlag = false;

  return this;
}

var PointRange = function(style, id) {
  // public methods
  this.drawEditable = function(fcanvas, frame, selectCb, style) {
    var isNew = false;
    if (!editObj) {
      cw = fcanvas.width; ch = fcanvas.height;
      rad = 5;

      // left top w h
      curData = [cw*.5 - rad, ch*.5 - rad, rad];
      editObj = createPoint(fill, curData[0], curData[1], curData[2]);

      isNew = true;
      
      storedMouseMoveEvents = fcanvas.__eventListeners['mouse:move'];
      storedCanvasCursor = fcanvas.hoverCursor;
      fcanvas.hoverCursor = '';
      // fcanvas.hoverCursor = 'url("src/point.cur") 10 10, crosshair';
      // fcanvas.hoverCursor = 'url("src/point.cur") 1 1, crosshair';

      var onMouseMove = function(e) {
        if (editObj) {
          r = rad; 
          y = e.e.layerY-rad; x = e.e.layerX-rad;

          editObj.setTop(y);
          editObj.setLeft(x);
          curData = [x, y, r];

          editObj.setCoords();
          fcanvas.renderAll();
          fcanvas.setActiveObject(editObj);
        }
      };
      fcanvas.__eventListeners['mouse:move'] = [onMouseMove];

      // replace existing mouse up callbacks with a custom one
      // while PointRange is drawing an Editable
      storedMouseUpEvents = fcanvas.__eventListeners['mouse:up'];
      var onMouseUp = function(e) {
        if (editObj && !e.target ) {
          r = rad; y = e.e.layerY-rad; x = e.e.layerX-rad;
          editObj.setTop(y); editObj.setLeft(x);
          curData = [x, y, r];

          editObj.setCoords();
          fcanvas.renderAll();
          fcanvas.setActiveObject(editObj);
        }
      };
      fcanvas.__eventListeners['mouse:up'] = [onMouseUp];


      editObj.on('selected', function() {
        selectCb();
      });

      editObj.on('modified', function() {
        o = editObj;
        curData = [o.getLeft(), o.getTop(), rad];
      });
    }

    // handle hints, constraints here
   
    editObj.setCoords();
    if (isNew) fcanvas.add(editObj);
    fcanvas.setActiveObject(editObj);
  };

  this.deleteReadable = function(fcanvas) {
    if (!intObj) return;
    fcanvas.remove(intObj);
    intObj = null;
  }

  this.deleteEditable = function(fcanvas) {
    if (!editObj) return;

    fcanvas.__eventListeners['mouse:up'] = storedMouseUpEvents;
    fcanvas.__eventListeners['mouse:move'] = storedMouseMoveEvents;
    storedMosueUpEvents = null; storedMouseMoveEvents = null;
    fcanvas.hoverCursor = storedCanvasCursor;
    storedCanvasCursor = '';

    fcanvas.remove(editObj);
    editObj = null;
  }

  this.drawReadable = function(fcanvas, frame, style) {
    if (!(beginFrame <= frame && frame <= endFrame)) {
      if (intObj) this.deleteReadable(fcanvas);
      return;
    }
  
    dat = getData(frame);
    if (!intObj) {
      intObj = createPoint(fill, dat[0], dat[1], dat[2]);
      intObj.fill = '';
      intObj.stroke = fill;
      intObj.strokeWidth = 3;
      intObj.strokeDashArray = ['-', '-'];

      intObj.selectable = false;
      intObj.rngClass = this;

      isNew = true;
      fcanvas.add(intObj);
      return;
    }

    if (highlightFlag) intObj.strokeWidth = 10;
    else intObj.strokeWidth = 3;

    intObj.left = dat[0];
    intObj.top = dat[1];
    intObj.radius = dat[2];
    intObj.setCoords();
  }

  this.setStyle = function(style) {
    fill = style.fill;
  }

  this.serializable = function() {
    var bundle = {data: data, 
                  mask: mask,
                  range: this.range(),
                  type: 'Point',
                  version: '0.1'
                 };
    // var jsonArray = JSON.parse(JSON.stringify(rng))
    // var jsonStr = JSON.stringify(rng);
    return bundle;
  };

  this.fromSerializable = function(bundle) {
    data = bundle.data;
    mask = bundle.mask;
    beginFrame = bundle.range[0];
    endFrame = bundle.range[1];
    return this;
  }

  // return Array of data for a given frame
  this.data = function(frame) {
    // return 
  };                 

  // return Array of mask for a given frame
  this.mask = function(frame) {
    // return mask[frmae];
  };

  this.highlight = function(fcanvas, flag) {
    highlightFlag = flag;
  }

  // add current data to data/mask
  this.commit = function(frame) {
    if (!curData) return false;
    setData(frame, curData);

    beginFrame = Lazy(mask).min();
    endFrame = Lazy(mask).max();
    return true;
  };
  
  this.uncommit = function(frame) {
    var idx = Lazy(mask).indexOf(frame);
    if (idx == -1) return false;
    
    mask.splice(idx, 1);
    data.splice(idx, 1);

    if (mask.length > 0) {
      beginFrame = Lazy(mask).min();
      endFrame = Lazy(mask).max();
    } else {
      beginFrame = -1;
      endFrame = -1;
    }
    return true;
  }

  this.getRid = function() {return rid;};
  this.range = function() {return [beginFrame, endFrame];};
  this.isSpatial = function() {return spatial;};

  // private methods
  function createPoint(cstr, left, top, radius) {
    var p = new fabric.Circle({
      'fill': cstr,
      'left': left, 'top': top,
      'radius': radius,
      'lockRotation': true,
      'hasControls': false
    });
    p.setControlsVisibility({mtr: false});
    return p;
  }

  // private functions
  function getData(frame) {
    if (endFrame < frame || frame < beginFrame) return;
    var idx = Lazy(mask).indexOf(frame);
    if (idx != -1) return data[idx];

    // else we must interpolate
    var idx = Lazy(mask).sortedIndex(frame);
    arr = [mask[idx-1], mask[idx]];
    val = [data[idx-1], data[idx]];
    
    // (val-min)/(max-min)
    var ratio = (frame-arr[0])/(arr[1]-arr[0]);

    interp = [0,0,0,0];
    for (i=0;i<4;i++) {
      interp[i] = val[0][i]*(1-ratio) + val[1][i]*ratio;
    }
    return interp;
  }

  // add data to list in sorted order
  function setData(frame, dat) {
    if (mask.length == 0) {
      mask.push(frame);
      data.push(dat);
      return;
    }

    var idx = Lazy(mask).indexOf(frame);
    if (idx == -1) {
      var idx = Lazy(mask).sortedIndex(frame);
      mask.splice(idx, 0, frame);
      data.splice(idx, 0, dat);
      return;
    }
    data[idx] = dat;
  }

  // public properties
  // this.isSpatial = false;

  // private properties
  var fill = style.fill;

  var D = 3;
  var data = new Array(0);
  var mask = new Array(0);

  var beginFrame = -1;
  var endFrame = -1;
  var spatial = true;

  var intObj = null;  // object that's actually drawn to canvas
  var editObj = null;

  var curData = null; 
  var rid = id;

  var storedMouseUpEvents = null;
  var storedMouseMoveEvents = null;

  var highlightFlag = false;
  return this;
}

var GroupRange = function(style, id) {
  // public methods
  
  this.drawEditable = function(fcanvas, frame, selectCb, style) {
    curFrame = frame;

    if (storedMouseUpEvents) return;
    storedMouseUpEvents = fcanvas.__eventListeners['mouse:up'];
    var onMouseUp = function(e) {
      var obj = e.target;
      if (!obj || !('rngClass' in obj)) {
        for (i=0;i<curData.length;i++) {
          curData[i].highlight(fcanvas,false);
          curData[i].drawReadable(fcanvas, curFrame, {});
        }
        if (curData.length>0) fcanvas.renderAll();
        curData = [];       
        selectCb();
        return;
      }
      obj = e.target.rngClass;

      var idx = Lazy(curData).indexOf(obj);
      if (idx != -1) return;
      obj.highlight(fcanvas, true);
      obj.drawReadable(fcanvas, curFrame, {});
      fcanvas.renderAll();
      curData.push(obj);
      selectCb();
    };
    fcanvas.__eventListeners['mouse:up'] = [onMouseUp];
  };

  this.setStyle = function(style) {
    fill = style.fill;
  }

  this.deleteReadable = function(fcanvas) {
    // if (!intObj) return;
    // fcanvas.remove(intObj);
    // intObj = null;
  }

  this.deleteEditable = function(fcanvas) {
    fcanvas.__eventListeners['mouse:up'] = storedMouseUpEvents;

    for (i=0;i<curData.length;i++) {
      curData[i].highlight(fcanvas,false);
      curData[i].drawReadable(fcanvas, frame, {});
    }
    if (curData.length>0) fcanvas.renderAll();
    curData = [];       
  }

  this.drawReadable = function(fcanvas, frame, style) {
    // if (!(beginFrame <= frame && frame <= endFrame)) {
    //   if (intObj) this.deleteReadable(fcanvas);
    //   return;
    // }
    //
    // dat = getData(frame);
    // if (!intObj) {
    //   intObj = createPoint(fill, dat[0], dat[1], dat[2]);
    //   intObj.fill = '';
    //   intObj.stroke = fill;
    //   intObj.strokeWidth = 3;
    //   intObj.strokeDashArray = ['-', '-'];
    //
    //   intObj.selectable = false;
    //
    //   isNew = true;
    //   fcanvas.add(intObj);
    //   return;
    // }
    //
    // intObj.left = dat[0];
    // intObj.top = dat[1];
    // intObj.radius = dat[2];
    // intObj.setCoords();
  }

  this.range = function() {return [beginFrame, endFrame];};

  // add current data to data/mask
  this.commit = function(frame) {
    if (curData.length == 0) return false;
    if (setData(frame, curData)) {
      beginFrame = Lazy(mask).min();
      endFrame = Lazy(mask).max();
      console.log([beginFrame, endFrame]);
      return true;
    } else return false;

  };

  this.uncommit = function(frame) {
    var idx = Lazy(mask).indexOf(frame);
    if (idx == -1) return false;
    
    mask.splice(idx, 1);
    if (mask.length > 0) {
      beginFrame = Lazy(mask).min();
      endFrame = Lazy(mask).max();
    } else {
      beginFrame = -1;
      endFrame = -1;
    }

    return true;
  }
  
  this.getRid = function() {return rid;};
  this.isSpatial = function() {return spatial;};

  this.getData = function(frame) {
    if (endFrame < frame || frame < beginFrame) return [];
    else return data;
  }

  this.serializable = function() {
    var bundle = {data: data, 
                  mask: mask,
                  range: this.range(),
                  type: 'Group',
                  version: '0.1'
                 };
    return bundle;
  };

  this.fromSerializable = function(bundle) {
    data = bundle.data;
    mask = bundle.mask;
    beginFrame = bundle.range[0];
    endFrame = bundle.range[1];
    return this;
  }


  // private methods
  // set the group rids according to most recent selection, 0
  function setData(frame, datt) {
    var rids = datt.map(function(rngObj, idx, arr) {return rngObj.getRid(); });
    if (rids.length < 2) return false; // group must have at least two data

    if (data.length == 0) {
      beginFrame = frame;
      endFrame = frame;
    } else if (beginFrame == endFrame) {
      beginFrame = Math.min(frame, beginFrame);
      endFrame = Math.max(frame, endFrame);
    } else {
      // we have set a begin and end time, so replace one based on which is closest
      if (Math.abs(beginFrame - frame) < Math.abs(endFrame - frame)) beginFrame = frame;
      else endFrame = frame;
    }
    data = rids;
    mask = [beginFrame, endFrame];
    return true;
  }

  // public properties
  // this.isSpatial = false;

  // private properties
  // var nFrames = numFrames;
  var fill = style.fill;

  var D = -1; // non-fixed dimension 
  var data = new Array(0);
  var mask = new Array(0);

  var beginFrame = -1;
  var endFrame = -1;
  var spatial = false;

  var intObj = null;  // objects that are actually drawn to canvas
  var editObj = null;

  var rid = id;
  var storedMouseUpEvents = null;
  var curData = [];
  var curFrame = -1;
  var beginFrameSet = false;

  return this;
}
