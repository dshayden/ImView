
var RectangleRange = function(style, id) {

  // public methods
  this.getType = function() {return 'Rect';};

  this.loc = function(frame) {
    var dat = getData(frame); // x,y,w,h
    if (!dat) return false;

    dat[0] = dat[0] + dat[2]/2;
    dat[1] = dat[1] + dat[3]/2;
    dat.splice(2,1);
    return dat;
  }

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
    if (idx != -1) return data[idx].slice(0);

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

  this.getType = function() {return 'Point';};

  // return center location for frame
  this.loc = function(frame) {
    var dat = getData(frame);

    if (!dat) return false;
    dat[0] = dat[0] + dat[2]/2;
    dat[1] = dat[1] + dat[2]/2;
    dat.splice(2,1);
    return dat;
  }

  this.drawEditable = function(fcanvas, frame, selectCb, style) {
    console.log('PointRange: drawEditable');

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
        console.log('PointRange onMouseMove');
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
      // storedMouseUpEvents = fcanvas.__eventListeners['mouse:up'];
      // var onMouseUp = function(e) {
      //   if (editObj && !e.target ) {
      //     r = rad; y = e.e.layerY-rad; x = e.e.layerX-rad;
      //     editObj.setTop(y); editObj.setLeft(x);
      //     curData = [x, y, r];
      //
      //     editObj.setCoords();
      //     fcanvas.renderAll();
      //     fcanvas.setActiveObject(editObj);
      //   }
      // };
      // fcanvas.__eventListeners['mouse:up'] = [onMouseUp];


      editObj.on('selected', function() {
        selectCb();
      });

      editObj.on('modified', function() {
        o = editObj;
        curData = [o.getLeft(), o.getTop(), rad];
      });
    }

    // handle hints, constraints here
    if (hintFcn) {
      var loc = hintFcn(frame);
      if (loc) {
        curData = [loc[0] - rad/2, loc[1] - rad/2, rad];
        editObj.setTop(curData[1]);
        editObj.setLeft(curData[0]);
        // fcanvas.renderAll();
      }
    }
   
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
    console.log('PointRange: deleteEditable');
    if (!editObj) return;

    // fcanvas.__eventListeners['mouse:up'] = storedMouseUpEvents;
    // storedMosueUpEvents = null; 
    
    fcanvas.__eventListeners['mouse:move'] = storedMouseMoveEvents;
    storedMouseMoveEvents = null;
    fcanvas.hoverCursor = storedCanvasCursor;
    storedCanvasCursor = '';

    fcanvas.remove(editObj);
    editObj.on('selected', function() {});

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

  this.setLocationHint = function( _hintFcn ) {
    hintFcn = _hintFcn;
  };

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
    if (endFrame < frame || frame < beginFrame) return false;
    var idx = Lazy(mask).indexOf(frame);
    if (idx != -1) return data[idx].slice(0); // returns a copy

    // else we must interpolate
    var idx = Lazy(mask).sortedIndex(frame);
    arr = [mask[idx-1], mask[idx]];
    val = [data[idx-1], data[idx]];

    // (val-min)/(max-min)
    var ratio = (frame-arr[0])/(arr[1]-arr[0]);

    var interp = [0,0,0];
    for (i=0;i<3;i++) {
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

  var hintFcn = null;

  var highlightFlag = false;
  return this;
}

var GroupRange = function(style, id) {
  // public methods

  this.getType = function() {
    return 'Group';
  };
  
  this.drawEditable = function(fcanvas, frame, selectCb, style) {
    curFrame = frame;

    if (storedMouseUpEvents) {
      console.log(storedMouseUpEvents);

      // update enclosing rect if curData.length >= 1
      if (curData.length == 0) return;
      var r = getEnclosingRect(curData, frame);

      editObj.left = r[0];
      editObj.top = r[1];
      editObj.width = r[2];
      editObj.height = r[3];

      if (curData.length == 1) {
        editObj.height += 10;
        eidtObj.width += 10;
      }
      fcanvas.renderAll();
      selectCb();
      return;
    }

    storedMouseUpEvents = fcanvas.__eventListeners['mouse:up'];

    var onMouseUp = function(e) {
      var canvasObj = e.target;

      // if user clicked on empty space then clear selection
      if (!canvasObj || !('rngClass' in canvasObj)) {
        if (editObj) {
          fcanvas.remove(editObj);
          editObj = null;
        }
        curData = [];
        selectCb();
        return;
      }

      obj = e.target.rngClass;
      if (!editObj) {
        var loc = obj.loc(frame);  // [x,y]
        editObj = createRect(fill, loc[0]-10, loc[1]-10, 20, 20);
        editObj.selectable = false;

        fcanvas.add(editObj);
        fcanvas.sendToBack(editObj);
      }

      var idx = Lazy(curData).indexOf(obj);
      if (idx != -1) return; // or do we unselect?
      curData.push(obj);

      if (curData.length > 1) {
        var r = getEnclosingRect(curData, frame);
        editObj.left = r[0];
        editObj.top = r[1];
        editObj.width = r[2];
        editObj.height = r[3];
        fcanvas.renderAll();
      }
      editObj.setCoords(); 

      selectCb();
    };
    fcanvas.__eventListeners['mouse:up'] = [onMouseUp];
  };

  this.setStyle = function(style) {
    fill = style.fill;
  }

  this.deleteReadable = function(fcanvas) {
    if (!intObj) return;
    fcanvas.remove(intObj);
    intObj = null;
  }

  this.deleteEditable = function(fcanvas) {
    if (storedMouseUpEvents == null && editObj == null) return;

    fcanvas.__eventListeners['mouse:up'] = storedMouseUpEvents;
    storedMouseUpEvents = null;

    fcanvas.remove(editObj);
    editObj = null;

    if (curData.length>0) fcanvas.renderAll();
    curData = [];       
  }

  this.drawReadable = function(fcanvas, frame, style) {
    if (!(beginFrame <= frame && frame <= endFrame)) {
      if (intObj) this.deleteReadable(fcanvas);
      return;
    }
    
    var r = getEnclosingRect(curRngObjs, frame);

    if (!intObj) {
      intObj = createRect(fill, r[0], r[1], r[2], r[3]);
      intObj.fill = fill;
      intObj.stroke = fill;
      intObj.selectable = false;

      isNew = true;
      fcanvas.add(intObj);
      fcanvas.sendToBack(intObj);
      return;
    }
    
    intObj.left = r[0];
    intObj.top = r[1];
    intObj.width = r[2];
    intObj.height = r[3];
    intObj.setCoords();
  }

  this.range = function() {return [beginFrame, endFrame];};

  // add current data to data/mask
  this.commit = function(frame) {
    if (curData.length == 0) return false;
    if (setData(frame, curData)) {
      beginFrame = Lazy(mask).min();
      endFrame = Lazy(mask).max();
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

  // this breaks the standard abstraction model, but oh well
  this.updateObjRefs = function() {
    var dat = Lazy(data);

    var allRngObjs = $("#aRngTbl").DataTable().columns(7).data()[0];
    for (i=0;i<allRngObjs.length;i++) {
      if ( dat.contains( allRngObjs[i].getRid() ) ) {
        curRngObjs.push(allRngObjs[i]);
      }
    }
  }

  // private methods
  
  function getEnclosingRect(objs, frame) {

    var locs = Lazy(objs.map(function(rngObj, idx, arr) {return rngObj.loc(frame); }));
    locs = Lazy(locs.filter(function(x) {if(x.length == 2)return true; else return false;}).value());

    if (locs.length() == 0) return [0, 0, 0, 0];

    var xs = locs.map(function(pair, idx, arr) {return pair[0];});
    var ys = locs.map(function(pair, idx, arr) {return pair[1];});

    var left = xs.min();
    var top = ys.min();
    var width = xs.max() - left;
    var height = ys.max() - top;
    return [left, top, width, height];
  }

  function createRect(cstr, left, top, width, height) {
    var rect = new fabric.Rect({
      'fill': cstr,
      'width': width, 'height': height,
      'left': left, 'top': top,
      'lockRotation': true
    });
    rect.setControlsVisibility({
      bl: false, br: false, mb: false, ml: false, mr: false,
      mt: false, tl: false, tr: false, mtr: false
    });
    return rect;
  }

  // Parse hex/rgb{a} color syntax.
  // @input string
  // @returns array [r,g,b{,o}]
  // https://gist.github.com/THEtheChad/1297590
  function parseColor(color) {
    var cache
      , p = parseInt // Use p as a byte saving reference to parseInt
      , color = color.replace(/\s\s*/g,'') // Remove all spaces
    ;//var
    
    // Checks for 6 digit hex and converts string to integer
    if (cache = /^#([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})/.exec(color)) 
        cache = [p(cache[1], 16), p(cache[2], 16), p(cache[3], 16)];
        
    // Checks for 3 digit hex and converts string to integer
    else if (cache = /^#([\da-fA-F])([\da-fA-F])([\da-fA-F])/.exec(color))
        cache = [p(cache[1], 16) * 17, p(cache[2], 16) * 17, p(cache[3], 16) * 17];
        
    // Checks for rgba and converts string to
    // integer/float using unary + operator to save bytes
    else if (cache = /^rgba\(([\d]+),([\d]+),([\d]+),([\d]+|[\d]*.[\d]+)\)/.exec(color))
        cache = [+cache[1], +cache[2], +cache[3], +cache[4]];
        
    // Checks for rgb and converts string to
    // integer/float using unary + operator to save bytes
    else if (cache = /^rgb\(([\d]+),([\d]+),([\d]+)\)/.exec(color))
        cache = [+cache[1], +cache[2], +cache[3]];
        
    // Otherwise throw an exception to make debugging easier
    else throw Error(color + ' is not supported by $.parseColor');
    
    // Performs RGBA conversion by default
    isNaN(cache[3]) && (cache[3] = 1);
    
    // Adds or removes 4th value based on rgba support
    // Support is flipped twice to prevent erros if
    // it's not defined
    return cache.slice(0,3 + !!$.support.rgba);
  }

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

    curRngObjs = datt;
    return true;
  }

  // public properties
  // this.isSpatial = false;

  // private properties

  // artificially lower the alpha value for easier visualization
  var c = parseColor(style.fill);
  var fill = 'rgba('+c[0].toString()+','+c[1].toString()+','+c[2].toString()+',0.4)';

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

  var curRngObjs = [];

  return this;
}

var LineRange = function(style, id) {
  // public methods
  this.getType = function() {return 'Line';};

  this.drawEditable = function(fcanvas, frame, selectCb, style) {
    var isNew = false;
    if (!editObj) {
      cw = fcanvas.width; ch = fcanvas.height;
      len = 20;

      // x1, y1, x2, y2
      curData = [cw*.5, ch*.5, cw*.5+len, ch*.5];
      editObj = createLine(fill, curData);
      isNew = true;
      storedMouseMoveEvents = fcanvas.__eventListeners['mouse:move'];
      storedCanvasCursor = fcanvas.hoverCursor;
      fcanvas.hoverCursor = '';

      var onMouseMove = function(e) {
        if (editObj) {
          y = e.e.layerY; x = e.e.layerX;
          editObj.set('x2', x);
          editObj.set('y2', y);
          curData = [curData[0], curData[1], x, y];

          editObj.setCoords();
          fcanvas.renderAll();
          fcanvas.setActiveObject(editObj);
        }
      };
      fcanvas.__eventListeners['mouse:move'] = [onMouseMove];

      editObj.on('selected', function() {
        selectCb();
      });

      editObj.on('modified', function() {
        o = editObj;
        curData = [o.get('x1'), o.get('y1'), o.get('x2'), o.get('y2')];
      });
    }

    // handle hints, constraints here
    if (hintFcn) {
      var loc = hintFcn(frame);
      if (loc) {
        editObj.set('x1', loc[0]);
        editObj.set('y1', loc[1]);
        curData[0] = loc[0];
        curData[1] = loc[1];
      }
    }

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

    // fcanvas.__eventListeners['mouse:up'] = storedMouseUpEvents;
    // storedMosueUpEvents = null; 
    
    fcanvas.__eventListeners['mouse:move'] = storedMouseMoveEvents;
    storedMouseMoveEvents = null;
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
      intObj = createLine(fill, dat);
      intObj.stroke = fill;
      intObj.strokeWidth = 3;
      intObj.strokeDashArray = [5, 5];

      intObj.selectable = false;
      intObj.rngClass = this;

      isNew = true;
      fcanvas.add(intObj);
      return;
    }

    if (highlightFlag) intObj.strokeWidth = 10;
    else intObj.strokeWidth = 3;

    intObj.set('x1', dat[0]);
    intObj.set('y1', dat[1]);
    intObj.set('x2', dat[2]);
    intObj.set('y2', dat[3]);

    intObj.setCoords();
  }

  this.setStyle = function(style) {
    fill = style.fill;
  }

  this.serializable = function() {
    var bundle = {data: data, 
                  mask: mask,
                  range: this.range(),
                  type: 'Line',
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

  this.setLocationHint = function( _hintFcn ) {
    hintFcn = _hintFcn;
  };

  // private methods

  function createLine(cstr, pts) {
    var p = new fabric.Line( [pts[0], pts[1], pts[2], pts[3]], {
      stroke: cstr,
      strokeWidth: 5,
    });

    p.setControlsVisibility({
      bl: false, br: false, mb: false, ml: false, mr: false,
      mt: false, tl: false, tr: false, mtr: false
    });

    return p;
  }

  // private functions
  function getData(frame) {
    if (endFrame < frame || frame < beginFrame) return false;
    var idx = Lazy(mask).indexOf(frame);
    if (idx != -1) return data[idx].slice(0);

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

  var D = 4;
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

  var hintFcn = null;

  var highlightFlag = false;
  return this;
}

var AngleRange = function(style, id) {
  // public methods

  this.getType = function() {return 'Angle';};

  this.drawEditable = function(fcanvas, frame, selectCb, style) {
    var isNew = false;
    if (!editObj) {
      cw = fcanvas.width; ch = fcanvas.height;

      // x1, y1, x2, y2
      curData = [cw*.5, ch*.5, 0];
      editObj = createAngle(fill, curData[0], curData[1], curData[2]);

      isNew = true;
      storedMouseMoveEvents = fcanvas.__eventListeners['mouse:move'];
      storedCanvasCursor = fcanvas.hoverCursor;
      fcanvas.hoverCursor = '';

      var onMouseMove = function(e) {
        if (editObj) {
          var y = e.e.layerY, x = e.e.layerX;
          
          // center point then get angle
          var yy = y - curData[1];
          var xx = x - curData[0];
          var theta = Math.atan2(yy, xx);         

          var sgns = angleSigns(theta);
          var x2 = sgns[0]*Math.cos(sgns[2])*len + curData[0];
          var y2 = sgns[1]*Math.sin(sgns[2])*len + curData[1];

          editObj.set('x2', x2);
          editObj.set('y2', y2);
          curData = [curData[0], curData[1], theta];

          editObj.setCoords();
          fcanvas.renderAll();
          fcanvas.setActiveObject(editObj);
        }
      };
      fcanvas.__eventListeners['mouse:move'] = [onMouseMove];

      editObj.on('selected', function() {
        selectCb();
      });

      editObj.on('modified', function() {
        o = editObj;
        // curData = [o.get('x1'), o.get('y1'), o.get('x2'), o.get('y2')];
        // curData = [o.get('x1'), o.get('y1'), o.get('x2'), o.get('y2')];
      });
    }

    // handle hints, constraints here
    if (hintFcn) {
      var loc = hintFcn(frame);
      if (loc) {
        editObj.set('x1', loc[0]);
        editObj.set('y1', loc[1]);

        var sgns = angleSigns(curData[2]);
        var x2 = sgns[0]*Math.cos(sgns[2])*len + loc[0];
        var y2 = sgns[1]*Math.sin(sgns[2])*len + loc[1];
        editObj.set('x2', x2);
        editObj.set('y2', y2);

        curData[0] = loc[0];
        curData[1] = loc[1];
      }
    }

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

    // fcanvas.__eventListeners['mouse:up'] = storedMouseUpEvents;
    // storedMosueUpEvents = null; 
    
    fcanvas.__eventListeners['mouse:move'] = storedMouseMoveEvents;
    storedMouseMoveEvents = null;
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
      intObj = createAngle(fill, dat[0], dat[1], dat[2]);
      intObj.stroke = fill;
      intObj.strokeWidth = 3;
      intObj.strokeDashArray = [2, 2];

      intObj.selectable = false;
      intObj.rngClass = this;

      isNew = true;
      fcanvas.add(intObj);
      return;
    }

    if (highlightFlag) intObj.strokeWidth = 10;
    else intObj.strokeWidth = 3;

    intObj.set('x1', dat[0]);
    intObj.set('y1', dat[1]);

    var sgns = angleSigns(dat[2]);
    var x2 = sgns[0]*Math.cos(sgns[2])*len + dat[0];
    var y2 = sgns[1]*Math.sin(sgns[2])*len + dat[1];
    intObj.set('x2', x2);
    intObj.set('y2', y2);

    intObj.setCoords();
  }

  this.setStyle = function(style) {
    fill = style.fill;
  }

  this.serializable = function() {
    var bundle = {data: data, 
                  mask: mask,
                  range: this.range(),
                  type: 'Angle',
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

  this.setLocationHint = function( _hintFcn ) {
    hintFcn = _hintFcn;
  };

  // private methods

  function angleSigns(theta) {
    if (0 <= theta && theta < Math.PI/2) return [1, 1, theta];
    else if (Math.PI/2 <= theta && theta <= Math.PI) return [-1, 1, Math.PI/2 - (theta-Math.PI/2)];
    else if (-Math.PI <= theta && theta <= -Math.PI/2) return [-1, -1, Math.PI/2 - (Math.abs(theta)-Math.PI/2)];
    else if (-Math.PI/2 <= theta && theta < 0) return [1, -1, Math.abs(theta)];
  }

  function createAngle(cstr, x, y, theta) {
    var sgns = angleSigns(theta);   
    var x2 = sgns[0]*Math.cos(sgns[2])*len+x;
    var y2 = sgns[1]*Math.sin(sgns[2])*len+y;

    var p = new fabric.Line( [x, y, x2, y2], {
      stroke: cstr,
      strokeWidth: 5,
    });

    p.setControlsVisibility({
      bl: false, br: false, mb: false, ml: false, mr: false,
      mt: false, tl: false, tr: false, mtr: false
    });

    return p;
  }

  // private functions
  function getData(frame) {
    if (endFrame < frame || frame < beginFrame) return false;
    var idx = Lazy(mask).indexOf(frame);
    if (idx != -1) return data[idx].slice(0);

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

  var D = 4;
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

  var hintFcn = null;
  var len = 20;

  var highlightFlag = false;
  return this;
}
