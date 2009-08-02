Function.prototype.anbind = function() {
  var args = [];
  for( var i = 0, len = arguments.length; i < len; ++i ) { args.push(arguments[i]); }
  var object = args.shift();
  var method = this;
  return function() {
    var _args = [];
    for( var i = 0, len = arguments.length; i < len; ++i ) { _args.push(arguments[i]); }
    return method.apply(object, args.concat(_args));
  }
}
Function.prototype.anbindEv = function() {
  var args = [];
  for( var i = 0, len = arguments.length; i < len; ++i ) { args.push(arguments[i]); }
  var object = args.shift();
  var method = this;
  return function(event) {
    var _args = [];
    for( var i = 0, len = arguments.length; i < len; ++i ) { _args.push(arguments[i]); }
    return method.apply(object, [event || window.event].concat(args.concat(_args)));
  }
}

AN = function() {}
AN.Gallery = function(sel,images) { this.init(sel,images); }
AN.Gallery.prototype = {
  init: function(sel,images) {
    var m = Sizzle(sel);
    this.el = m[0];
    // global settings clip height,width and offset from top
    this.width = 73;
    this.height = 69;
    this.canvasOffset = 248;

    this.images = [];
    this._imagesPending = images.length;
    for( var i = 0, len = images.length; i < len; ++i ) {
      var img = new Image();
      this.images.push( img );
      img.onload = this._imageReady.anbind(this,i);
      img.src = images[i];
    }
  },
  _imageReady: function(i) {
    if( --this._imagesPending == 0 ) { this._prepare(); this._render(); this._events(); }
  },
  _prepare: function() {
    var img = Sizzle('img', this.el)[0];
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width", img.width );
    canvas.setAttribute("height", img.height );
    this.canvas = canvas;
    this.images.unshift(img); // XXX: Image vs DOMImageElement - hopefully canvas drawImage accepts either?
    this.el.removeChild(img);
    this.el.appendChild(canvas);

    this.ctx = canvas.getContext("2d");
  },
  _render: function(img) {
    
    if( !img ) { img = this.images[0]; }

    this.ctx.drawImage(img, 0, 0, img.width, img.height);

    this.clips = []; // the original clip graphics before converting, so on hover we can flip them back
    this.hits = []; // the clip hit areas, so on mouse events we can detect which clip to show
    this.activeClip = null;

    var offset = 600;
    for( var i = 0, len = this.images.length; i < len; ++i ) {
      var ox = offset+(i*83);
      var img = this.images[i];
      this._renderClip(ox,img);
    }
  },
  _renderClip: function(ox,img) {
    //this.ctx.drawImage(img, (img.width/2), (img.height/2), this.width, this.height, ox, this.canvasOffset, this.width, this.height);
    this.ctx.drawImage(img, ox, this.canvasOffset, this.width, this.height);
    //console.log("draw: " + img + " at " + ox );
    this.clips.push( this._bwMask(ox, this.canvasOffset, this.width, this.height) );
    this.hits.push(ox); // save the x offset of each clip
  },
  _bwMask: function(ix,iy,iw,ih) {
    var cd = this.ctx.getImageData(ix, iy, iw, ih);
    var odata = [];

    for( var x = 0; x < cd.width; ++x ) {
      for( var y = 0; y < cd.height; ++y ) {
        var idx = (x+y*cd.width) * 4;
        var r = cd.data[idx+0];
        var g = cd.data[idx+1];
        var b = cd.data[idx+2];

        // save the original pixel data
        odata[idx+0] = r;
        odata[idx+1] = g;
        odata[idx+2] = b;

        // convert to gray scale
        var gray = (r + g + b) / 3;
        cd.data[idx+0] = gray;
        cd.data[idx+1] = gray;
        cd.data[idx+2] = gray;
      }
    }

    this.ctx.putImageData(cd, ix, iy);
    return {x: ix, odata: odata, bwdata: cd.data}; // save for later
  },
  _copy: function(cd,ndata) {
    for( var x = 0; x < cd.width; ++x ) {
      for( var y = 0; y < cd.height; ++y ) {
        var idx = (x+y*cd.width) * 4;
        cd.data[idx+0] = ndata[idx+0];
        cd.data[idx+1] = ndata[idx+1];
        cd.data[idx+2] = ndata[idx+2];
      }
    }
  },
  _events: function() {
    this.canvas.onmousedown = this._mouse.anbindEv(this);
    this.canvas.onmousemove = this._mouse.anbindEv(this);
    this.canvas.onmouseup = this._mouse.anbindEv(this);
  },
  _mouse: function(e) {
    var type = e.type;
    var mx = e.pageX, my = e.pageY;
    // see if we have a hit?
    var sx = this.hits[0];
    var ex = this.hits[this.hits.length-1] + this.width;
    var sy = this.canvasOffset;
    var ey = (this.canvasOffset+this.height);
    var hitIdx = null;

    if( /* clipping for x */ mx >= sx && mx <= ex &&
        /* clipping for y */ my >= sy && my <= ey ) {
      // figure out what we hit
      for( var i = 0, len = this.hits.length; i < len; ++i ) {
        var ox = this.hits[i];
        // mx = 649 ox = 620  ox+width = 693
        if( mx >= ox && mx <= (ox+this.width) ) {
          hitIdx = i;
          break;
        }
      }
    }

    if( hitIdx == null ) { return; }


    switch( type ) {
    case 'mousemove':
      if( hitIdx == this.activeClip ) {
        return;
      }

      if( hitIdx != null ) {
        var cdata, cd;
        //console.log("hit: " + hitIdx);
        // unset active clip
        if( this.activeClip != null ) {
          cdata = this.clips[this.activeClip];
          cd = this.ctx.getImageData(cdata.x, this.canvasOffset, this.width, this.height);
          this._copy(cd,cdata.bwdata);
          this.ctx.putImageData(cd, cdata.x, this.canvasOffset);
        }
        cdata = this.clips[hitIdx];
        cd = this.ctx.getImageData(cdata.x, this.canvasOffset, this.width, this.height);
        this._copy(cd,cdata.odata);
        this.ctx.putImageData(cd, cdata.x, this.canvasOffset);
        this.activeClip = hitIdx;
      }
      else if( this.activeClip != null ) {
        // unset active clips
        var cdata = this.clips[this.activeClip];
        var cd = this.ctx.getImageData(cdata.x, this.canvasOffset, this.width, this.height);
        this._copy(cd,cdata.bwdata);
        this.ctx.putImageData(cd, cdata.x, this.canvasOffset);
        this.activeClip = null;
      }
      break;
    case 'mousedown':
      this.downOnIdx = hitIdx;
      break;
    case 'mouseup':
      if( hitIdx == this.downOnIdx ) {
        this._render(this.images[this.downOnIdx]);
        console.log("show idx: " + this.downOnIdx);
      }
      this.downOnIdx = null;
      break;
    }
  }
};
