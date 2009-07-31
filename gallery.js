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
  return function() {
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
    if( --this._imagesPending == 0 ) { this._render(); }
  },
  _render: function() {
    var img = Sizzle('img', this.el)[0];
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width", img.width );
    canvas.setAttribute("height", img.height );
    this.el.removeChild(img);
    this.el.appendChild(canvas);
    this.ctx = canvas.getContext("2d");
    this.ctx.drawImage(img, 0, 0, img.width, img.height);

    var offset = 620;
    for( var i = 0, len = this.images.length; i < len; ++i ) {
      var ox = offset+(i*83);
      this.ctx.drawImage(this.images[i], ox, 248, 73, 69);
      console.log("draw: " + this.images[i] + " at " + (offset + (i*83)) );
      this._bwMask(ox, 248, 73, 69);
    }
  },
  _bwMask: function(ix,iy,iw,ih) {
    var cd = this.ctx.getImageData(ix, iy, iw, ih);
    for( var x = 0; x < cd.width; ++x ) {
      for( var y = 0; y < cd.height; ++y ) {
        var idx = (x+y*cd.width) * 4;
        var r = cd.data[idx+0];
        var g = cd.data[idx+1];
        var b = cd.data[idx+2];

        // convert to gray scale
        var gray = (r + g + b) / 3;
        cd.data[idx+0] = gray;
        cd.data[idx+1] = gray;
        cd.data[idx+2] = gray;
      }
    }
    console.log("add idata: " + ix + ", " + iy);
    this.ctx.putImageData(cd, ix, iy);
  }
};
