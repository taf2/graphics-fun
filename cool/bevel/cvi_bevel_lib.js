/**
 * cvi_bevel_lib.js 1.3 (14-Jul-2009) (c) by Christian Effenberger 
 * All Rights Reserved. Source: bevel.netzgesta.de
 * Distributed under Netzgestade Non-commercial Software License Agreement.
 * This license permits free of charge use on non-commercial 
 * and private web sites only under special conditions. 
 * Read more at... http://www.netzgesta.de/cvi/LICENSE.html

 * syntax:
	cvi_bevel.defaultRadius = 20;				//INT 20-40 (%)	
	cvi_bevel.defaultGlow = 33;					//INT 1-100 (% opacity)
	cvi_bevel.defaultShine = 40;				//INT 1-100 (% opacity)
	cvi_bevel.defaultShade = 50;				//INT 1-100 (% opacity)
	cvi_bevel.defaultGlowcolor = '#000000';		//STR '#000000'-'#ffffff' 
	cvi_bevel.defaultShinecolor = '#ffffff';	//STR '#000000'-'#ffffff' 
	cvi_bevel.defaultShadecolor = '#000000';	//STR '#000000'-'#ffffff' 
	cvi_bevel.defaultBackcolor = '#0080ff';		//STR '#000000'-'#ffffff' 
	cvi_bevel.defaultFillcolor = '#0080ff';		//STR '#000000'-'#ffffff' 
	cvi_bevel.defaultLinear = false;			//BOOLEAN
	cvi_bevel.defaultUsemask = false;			//BOOLEAN
	cvi_bevel.defaultNoglow = false;			//BOOLEAN
	cvi_bevel.defaultNoshine = false;			//BOOLEAN
	cvi_bevel.defaultNoshade = false;			//BOOLEAN
	
	depends on: cvi_filter_lib.js
		cvi_bevel.defaultFilter = null;//OBJ [{f='grayscale'},{f='emboss', s:1}...]
		
	cvi_bevel.remove( image );
	cvi_bevel.add( image, options );
	cvi_bevel.modify( image, options );
	cvi_bevel.add( image, { radius: value, glow: value, shine: value, shade: value, glowcolor: value, shinecolor: value, shadecolor: value, backcolor: value, fillcolor: value, linear: value, noglow: value, noshine: value, noshade: value, usemask: value } );
	cvi_bevel.modify( image, { radius: value, glow: value, shine: value, shade: value, glowcolor: value, shinecolor: value, shadecolor: value, backcolor: value, fillcolor: value, linear: value, noglow: value, noshine: value, noshade: value, usemask: value } );
 *
**/

function getRGB(val) {
	function hex2dec(hex){return(Math.max(0,Math.min(parseInt(hex,16),255)));}
	var mx=254,cr=hex2dec(val.substr(1,2)),cg=hex2dec(val.substr(3,2)),cb=hex2dec(val.substr(5,2));
	return Math.min(cr,mx)+','+Math.min(cg,mx)+','+Math.min(cb,mx);
}

function getRadius(radius,width,height){
	var part = (Math.min(width,height)/100);
	radius = Math.max(Math.min(100,radius/part),0);
	return radius+'%';
}

function applyForm(ctx,x,y,w,h,r,o,f) {
	var z=o?Math.round(r*((window.opera?0.3:0.25)*f)):0; 
	ctx.beginPath(); ctx.moveTo(x,y+r); ctx.lineTo(x,y+h-r);
	ctx.quadraticCurveTo(x+z,y+h-z,x+r,y+h); ctx.lineTo(x+w-r,y+h);
	ctx.quadraticCurveTo(x+w-z,y+h-z,x+w,y+h-r); ctx.lineTo(x+w,y+r);
	ctx.quadraticCurveTo(x+w-z,y+z,x+w-r,y); ctx.lineTo(x+r,y);
	ctx.quadraticCurveTo(x+z,y+z,x,y+r); ctx.closePath();
}

function applyFlex(ctx,x,y,w,h,r,o,c) {
	ctx.beginPath();ctx.moveTo(x-r,y-r); ctx.lineTo(x-r,y+r);
	ctx.lineTo(x,y+(r*2)); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); 
	ctx.lineTo(x+(r*2),y); ctx.lineTo(x+r,y-r); ctx.closePath();
	var st=ctx.createRadialGradient(x+(r/4),y+(r/4),0,x+(r/4),y+(r/4),r);
	st.addColorStop(0,'rgba('+c+','+o+')'); st.addColorStop(1,'rgba('+c+',0)');
	ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.moveTo(x+w+r,y-r); ctx.lineTo(x+w+r,y+r); 
	ctx.lineTo(x+w,y+(r*2)); ctx.lineTo(x+w,y+r); ctx.quadraticCurveTo(x+w,y,x+w-r,y); 
	ctx.lineTo(x+w-(r*2),y); ctx.lineTo(x+w-r,y-r); ctx.closePath();
	st=ctx.createRadialGradient(x+w-(r/4),y+(r/4),0,x+w-(r/4),y+(r/4),r);
	st.addColorStop(0,'rgba('+c+','+o+')'); st.addColorStop(1,'rgba('+c+',0)');
	ctx.fillStyle=st; ctx.fill();
}

function applyGlow(ctx,x,y,w,h,r,o,c) {
	function setRS(ctx,x1,y1,r1,x2,y2,r2,o,c) {
		var opt=Math.min(parseFloat(o+0.1),1.0),tmp=ctx.createRadialGradient(x1,y1,r1,x2,y2,r2);
		tmp.addColorStop(0,'rgba('+c+','+opt+')'); tmp.addColorStop(0.25,'rgba('+c+','+o+')');
		tmp.addColorStop(1,'rgba('+c+',0)'); return tmp;
	}
	function setLS(ctx,x,y,w,h,o,c) {
		var opt=Math.min(parseFloat(o+0.1),1.0),tmp=ctx.createLinearGradient(x,y,w,h);
		tmp.addColorStop(0,'rgba('+c+','+opt+')'); tmp.addColorStop(0.25,'rgba('+c+','+o+')');
		tmp.addColorStop(1,'rgba('+c+',0)'); return tmp;
	}
	var st,os=Math.round(Math.min(w,h)*(window.opera?0.058:0.05));
	ctx.beginPath(); ctx.rect(x+r,y,w-(r*2),r); ctx.closePath();	
	st=setLS(ctx,x+r,y+os,x+r,y,o,c); ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.rect(x,y+r,r,h-(r*2)); ctx.closePath();
	st=setLS(ctx,x+os,y+r,x,y+r,o,c); ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.rect(x+r,y+h-r,w-x-(r*2),r); ctx.closePath();
	st=setLS(ctx,x+r,y+h-os,x+r,y+h,o,c); ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.rect(x+w-r,y+r,r,h-y-(r*2)); ctx.closePath();
	st=setLS(ctx,x+w-os,y+r,x+w,y+r,o,c); ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.rect(x,y,r,r); ctx.closePath();
	st=setRS(ctx,x+r,y+r,r-os,x+r,y+r,r,o,c); ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.rect(x,y+h-r,r,r); ctx.closePath();
	st=setRS(ctx,x+r,y+h-r,r-os,x+r,y+h-r,r,o,c); ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.rect(w-r,h-r,x+r,y+r); ctx.closePath();
	st=setRS(ctx,w-r,h-r,r-os+x,w-r,h-r,y+r,o,c); ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.rect(x+w-r,y,r,r); ctx.closePath();
	st=setRS(ctx,x+w-r,y+r,r-os,x+w-r,y+r,r,o,c); ctx.fillStyle=st; ctx.fill();
}

function applyMask(ctx,x,y,w,h,r,o,c,i,z) {
	function setRS(ctx,x1,y1,r1,x2,y2,r2,o,c,i,z) {
		var sg=(i==true?o:0),eg=(i==true?0:o),mg=eg*(z==true?0.9:0.7);
		var tmp=ctx.createRadialGradient(x1,y1,r1,x2,y2,r2); tmp.addColorStop(0,'rgba('+c+','+sg+')');
		if(z==false) {tmp.addColorStop(0.9,'rgba('+c+','+mg+')');}tmp.addColorStop(1,'rgba('+c+','+eg+')'); return tmp;
	}
	function setLS(ctx,x,y,w,h,o,c,i,z) {
		var sg=(i==true?o:0),eg=(i==true?0:o),mg=eg*(z==true?0.9:0.7);
		var tmp=ctx.createLinearGradient(x,y,w,h); tmp.addColorStop(0,'rgba('+c+','+sg+')');
		if(z==false) {tmp.addColorStop(0.9,'rgba('+c+','+mg+')');}tmp.addColorStop(1,'rgba('+c+','+eg+')'); return tmp;
	}
	var st,os=r,p=Math.round(r/8); ctx.fillStyle='rgba('+c+','+o+')';
	if(i) {ctx.beginPath(); ctx.rect(x+r,y+r,w-(r*2),h-(r*2)); ctx.closePath(); ctx.fill();}
	if(window.opera && !i) {
		ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x+p,y+p,x+r,y); ctx.closePath(); ctx.fill();
		ctx.beginPath(); ctx.moveTo(x+w,y); ctx.lineTo(x+w,y+r); ctx.quadraticCurveTo(x+w-p,y+p,x+w-r,y); ctx.closePath(); ctx.fill();
		ctx.beginPath(); ctx.moveTo(x+w,y+h); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w-p,y+h-p,x+w-r,y+h); ctx.closePath(); ctx.fill();
		ctx.beginPath(); ctx.moveTo(x,y+h); ctx.lineTo(x,y+h-r); ctx.quadraticCurveTo(x+p,y+h-p,x+r,y+h); ctx.closePath(); ctx.fill();
	}
	ctx.beginPath(); ctx.rect(x+r,y,w-(r*2),os); ctx.closePath(); st=setLS(ctx,x+r,y+os,x+r,y,o,c,i,z); ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.rect(x,y,r,r); ctx.closePath(); st=setRS(ctx,x+r,y+r,r-os,x+r,y+r,r,o,c,i,z); ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.rect(x,y+r,os,h-(r*2)); ctx.closePath(); st=setLS(ctx,x+os,y+r,x,y+r,o,c,i,z); ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.rect(x,y+h-r,r,r); ctx.closePath(); st=setRS(ctx,x+r,y+h-r,r-os,x+r,y+h-r,r,o,c,i,z); ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.rect(x+r,y+h-os,w-(r*2),os); ctx.closePath(); st=setLS(ctx,x+r,y+h-os,x+r,y+h,o,c,i,z); ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.rect(x+w-r,y+h-r,r,r); ctx.closePath(); st=setRS(ctx,x+w-r,y+h-r,r-os,x+w-r,y+h-r,r,o,c,i,z); ctx.fillStyle=st; ctx.fill();
	ctx.beginPath(); ctx.rect(x+w-os,y+r,os,h-(r*2)); ctx.closePath(); st=setLS(ctx,x+w-os,y+r,x+w,y+r,o,c,i,z); ctx.fillStyle=st; ctx.fill(); 
	ctx.beginPath(); ctx.rect(x+w-r,y,r,r); ctx.closePath(); st=setRS(ctx,x+w-r,y+r,r-os,x+w-r,y+r,r,o,c,i,z); ctx.fillStyle=st; ctx.fill();
}

var cvi_bevel = {
	defaultRadius : 20,
	defaultGlow : 33,
	defaultShine : 40,
	defaultShade : 50,
	defaultGlowcolor : '#000000', 
	defaultShinecolor : '#ffffff', 
	defaultShadecolor : '#000000', 
	defaultBackcolor : '#0080ff', 
	defaultFillcolor : '#0080ff', 
	defaultLinear : false,
	defaultUsemask : false,
	defaultNoglow : false,
	defaultNoshine : false,
	defaultNoshade : false,
	defaultFilter : null,
	defaultCallback : null,
	add: function(image, options) {
		if(image.tagName.toUpperCase() == "IMG") {
			var defopts = { "radius" : cvi_bevel.defaultRadius, "glow" : cvi_bevel.defaultGlow, "shine" : cvi_bevel.defaultShine, "shade" : cvi_bevel.defaultShade, "glowcolor" : cvi_bevel.defaultGlowcolor, "shinecolor" : cvi_bevel.defaultShinecolor, "shadecolor" : cvi_bevel.defaultShadecolor, "backcolor" : cvi_bevel.defaultBackcolor, "fillcolor" : cvi_bevel.defaultFillcolor, "linear" : cvi_bevel.defaultLinear, "noglow" : cvi_bevel.defaultNoglow, "noshine" : cvi_bevel.defaultNoshine, "noshade" : cvi_bevel.defaultNoshade, "usemask" : cvi_bevel.defaultUsemask, "filter" : cvi_bevel.defaultFilter, "callback" : cvi_bevel.defaultCallback }
			if(options) {
				for(var i in defopts) { if(!options[i]) { options[i] = defopts[i]; }}
			}else {
				options = defopts;
			}
			var imageWidth  = ('iwidth'  in options) ? parseInt(options.iwidth)  : image.width;
			var imageHeight = ('iheight' in options) ? parseInt(options.iheight) : image.height;
			try {
				var object = image.parentNode; 
				if(document.all && document.namespaces && !window.opera) {
					if(document.namespaces['v']==null) {
						var e=["shape","shapetype","group","background","path","formulas","handles","fill","stroke","shadow","textbox","textpath","imagedata","line","polyline","curve","roundrect","oval","rect","arc","image"],s=document.createStyleSheet(); 
						for(var i=0; i<e.length; i++) {s.addRule("v\\:"+e[i],"behavior: url(#default#VML);");} document.namespaces.add("v","urn:schemas-microsoft-com:vml");
					}
					var display = (image.currentStyle.display.toLowerCase()=='block')?'block':'inline-block';        
					var canvas = document.createElement(['<var style="zoom:1;overflow:hidden;display:' + display + ';width:' + imageWidth + 'px;height:' + imageHeight + 'px;padding:0;">'].join(''));
					var flt =  image.currentStyle.styleFloat.toLowerCase();
					display = (flt=='left'||flt=='right')?'inline':display;
					canvas.options = options;
					canvas.dpl = display;
					canvas.id = image.id;
					canvas.alt = image.alt;
					canvas.name = image.name;
					canvas.title = image.title;
					canvas.source = image.src;
					canvas.className = image.className;
					canvas.style.cssText = image.style.cssText;
					canvas.height = imageHeight;
					canvas.width = imageWidth;
					object.replaceChild(canvas,image);
					cvi_bevel.modify(canvas, options);
				}else {
					var canvas = document.createElement('canvas');
					if(canvas.getContext("2d")) {
						canvas.options = options;
						canvas.id = image.id;
						canvas.alt = image.alt;
						canvas.name = image.name;
						canvas.title = image.title;
						canvas.source = image.src;
						canvas.className = image.className;
						canvas.style.cssText = image.style.cssText;
						canvas.style.height = imageHeight+'px';
						canvas.style.width = imageWidth+'px';
						canvas.height = imageHeight;
						canvas.width = imageWidth;
						object.replaceChild(canvas,image);
						cvi_bevel.modify(canvas, options);
					}
				}
			} catch (e) {
			}
		}
	},
	
	modify: function(canvas, options) {
		try {
			var radius = (typeof options['radius']=='number'?options['radius']:canvas.options['radius']); canvas.options['radius']=radius;
			var glow = (typeof options['glow']=='number'?options['glow']:canvas.options['glow']); canvas.options['glow']=glow;
			var shine = (typeof options['shine']=='number'?options['shine']:canvas.options['shine']); canvas.options['shine']=shine;
			var shade = (typeof options['shade']=='number'?options['shade']:canvas.options['shade']); canvas.options['shade']=shade;
			var glowcolor = (typeof options['glowcolor']=='string'?options['glowcolor']:canvas.options['glowcolor']); canvas.options['glowcolor']=glowcolor;
			var shinecolor = (typeof options['shinecolor']=='string'?options['shinecolor']:canvas.options['shinecolor']); canvas.options['shinecolor']=shinecolor;
			var shadecolor = (typeof options['shadecolor']=='string'?options['shadecolor']:canvas.options['shadecolor']); canvas.options['shadecolor']=shadecolor;
			var backcolor = (typeof options['backcolor']=='string'?options['backcolor']:canvas.options['backcolor']); canvas.options['backcolor']=backcolor;
			var fillcolor = (typeof options['fillcolor']=='string'?options['fillcolor']:canvas.options['fillcolor']); canvas.options['fillcolor']=fillcolor;
			var linear = (typeof options['linear']=='boolean'?options['linear']:canvas.options['linear']); canvas.options['linear']=linear;
			var noglow = (typeof options['noglow']=='boolean'?options['noglow']:canvas.options['noglow']); canvas.options['noglow']=noglow;
			var noshine = (typeof options['noshine']=='boolean'?options['noshine']:canvas.options['noshine']); canvas.options['noshine']=noshine;
			var noshade = (typeof options['noshade']=='boolean'?options['noshade']:canvas.options['noshade']); canvas.options['noshade']=noshade;
			var usemask = (typeof options['usemask']=='boolean'?options['usemask']:canvas.options['usemask']); canvas.options['usemask']=usemask;
			var filter = (typeof options['filter']=='object'?options['filter']:canvas.options['filter']); canvas.options['filter']=filter;
			var callback = (typeof options['callback']=='string'?options['callback']:canvas.options['callback']); canvas.options['callback']=callback;
			var ww = canvas.width, hh = canvas.height, ix = Math.round(Math.min(ww,hh)*0.05), iy = ix, iw = ww-(2*ix), ih = hh-(2*iy);
			if(document.all && document.namespaces && !window.opera) {
				if(canvas.tagName.toUpperCase() == "VAR") {
					var glo = Math.min(glow==0?40:glow*1.2,100), sio = shine==0?0.5:shine/100, sao = shade==0?0.5:shade/100, rdi = Math.max(Math.min(radius==0?20:radius,40),20);
					var glc = glowcolor.match(/^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)?glowcolor:'#000000';
					var sic = shinecolor.match(/^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)?shinecolor:'#ffffff';
					var sac = shadecolor.match(/^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)?shadecolor:'#000000';
					var bac = backcolor.match(/^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)?backcolor:'#0080ff';
					var flc = fillcolor.match(/^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)?fillcolor:backcolor;
					var mask = usemask?"filter:progid:DXImageTransform.Microsoft.Alpha(opacity=100,finishopacity=50,style=3);":"";
					var head, fill, foot='</v:group>', high='', ishine='', left='', right='', ishade='', iglow='', oline='';
					var f, p, r, t, ro, ri, outer, inner;
					if(!noglow) {
						outer = Math.max(Math.min(radius,40),20);
						ro = Math.round(Math.min(iw,ih)*(outer/100));	
						ri = Math.round(ro*0.8); r = ri/2;
						inner = getRadius(ri/2,iw-ri,ih-ri); 
						outer = outer*0.8; ro = Math.round(ro*0.8);
					}else {
						outer = Math.max(Math.min(radius,40),20);
						ix = 0; iy = 0; iw = ww; ih = hh;
						ri = Math.round(Math.min(iw,ih)*(outer/100));
						r = ri/2; inner = getRadius(ri/2,iw-ri,ih-ri);
						ro = ri;
					} t = Math.round(Math.max(Math.round(iw/200),1)); f = 0;
					if(!noglow) {iglow = '<v:roundrect arcsize="'+outer+'%" strokeweight="0" filled="t" stroked="f" fillcolor="'+glc+'" style="filter:Alpha(opacity='+glo+'), progid:dxImageTransform.Microsoft.Blur(PixelRadius='+(ix/2)+',MakeShadow=false); zoom:1;margin:-1px 0 0 -1px;padding:0;position:absolute;top:0px;left:0px;width:'+(iw+ix)+'px;height:'+(ih+iy)+'px;"><v:fill color="'+glc+'" opacity="1" /></v:roundrect>';}
					fill = '<v:roundrect arcsize="'+outer+'%" strokeweight="0" filled="t" stroked="f" fillcolor="#ffffff" style="zoom:1;margin:-1px 0 0 -1px;padding:0;position:absolute;top:'+iy+'px;left:'+ix+'px;width:'+iw+'px;height:'+ih+'px;"><v:fill method="linear" type="gradient" angle="0" color="'+flc+'" color2="'+bac+'" /></v:roundrect>';
					fill += '<v:roundrect arcsize="'+outer+'%" strokeweight="0" filled="t" stroked="f" style="'+mask+'zoom:1;margin:-1px 0 0 -1px;padding:0;position:absolute;top:'+iy+'px;left:'+ix+'px;width:'+iw+'px;height:'+ih+'px;"><v:fill src="'+canvas.source+'" type="frame" /></v:roundrect>';
					if(!noshade) {
						ishade = '<v:shape strokeweight="0" filled="t" stroked="f" fillcolor="#000000" coordorigin="0,0" coordsize="'+ro+','+ro+'" path="m '+ro+','+ro+' l 0,'+ro+' qy '+ro+',0 l '+ro+','+ro+' x e" style="position:absolute;margin: -1px 0 0 -1px;top:'+iy+'px;left:'+ix+'px;width:'+ro+'px;height:'+ro+'px;"><v:fill method="'+(linear?"sigma":"linear")+'" type="gradientradial" focus="1" focusposition="1,1" focussize="0.5,0.5" color="#'+sac+'" opacity="0" color2="#'+sac+'" o:opacity2="'+sao+'" /></v:shape>'; 
						ishade += '<v:shape strokeweight="0" filled="t" stroked="f" fillcolor="#000000" coordorigin="0,0" coordsize="'+ro+','+ro+'" path="m 0,'+ro+' l '+ro+','+ro+' qy 0,0 l 0,'+ro+' x e" style="position:absolute;margin: -1px 0 0 -1px;top:'+iy+'px;left:'+(ix+iw-ro)+'px;width:'+ro+'px;height:'+ro+'px;"><v:fill method="'+(linear?"sigma":"linear")+'" type="gradientradial" focus="1" focusposition="-0.5,1" focussize="0.5,0.5" color="#'+sac+'" opacity="0" color2="#'+sac+'" o:opacity2="'+sao+'" /></v:shape>'; 
						ishade += '<v:shape strokeweight="0" filled="t" stroked="f" fillcolor="#000000" coordorigin="0,0" coordsize="'+ro+','+ro+'" path="m '+ro+',0 l '+ro+','+ro+' qx 0,0 l '+ro+',0 x e" style="position:absolute;margin: -1px 0 0 -1px;top:'+(iy+ih-ro)+'px;left:'+ix+'px;width:'+ro+'px;height:'+ro+'px;"><v:fill method="'+(linear?"sigma":"linear")+'" type="gradientradial" focus="1" focusposition="1,-0.5" focussize="0.5,0.5" color="#'+sac+'" opacity="0" color2="#'+sac+'" o:opacity2="'+sao+'" /></v:shape>'; 
						ishade += '<v:shape strokeweight="0" filled="t" stroked="f" fillcolor="#000000" coordorigin="0,0" coordsize="'+ro+','+ro+'" path="m 0,0 l '+ro+',0 qy 0,'+ro+' l 0,0 x e" style="position:absolute;margin: -1px 0 0 -1px;top:'+(iy+ih-ro)+'px;left:'+(ix+iw-ro)+'px;width:'+ro+'px;height:'+ro+'px;"><v:fill method="'+(linear?"sigma":"linear")+'" type="gradientradial" focus="1" focusposition="-0.5,-0.5" focussize="0.5,0.5" color="#'+sac+'" opacity="0" color2="#'+sac+'" o:opacity2="'+sao+'" /></v:shape>'; 
						ishade += '<v:rect strokeweight="0" filled="t" stroked="f" fillcolor="#000000" style="position:absolute;margin: -1px 0 0 -1px;top:'+iy+'px;left:'+(ix+ro-f)+'px;width:'+(iw-ro-ro+f+f)+'px;height:'+ro+'px;"><v:fill method="'+(linear?"sigma":"linear")+'" type="gradient" angle="0" color="#'+sac+'" opacity="0" color2="#'+sac+'" o:opacity2="'+sao+'" /></v:rect>';	
						ishade += '<v:rect strokeweight="0" filled="t" stroked="f" fillcolor="#000000" style="position:absolute;margin: -1px 0 0 -1px;top:'+(iy+ro-f)+'px;left:'+ix+'px;width:'+ro+'px;height:'+(ih-ro-ro+f+f)+'px;"><v:fill method="'+(linear?"sigma":"linear")+'" type="gradient" angle="90" color="#'+sac+'" opacity="0" color2="#'+sac+'" o:opacity2="'+sao+'" /></v:rect>';	
						ishade += '<v:rect strokeweight="0" filled="t" stroked="f" fillcolor="#000000" style="position:absolute;margin: -1px 0 0 -1px;top:'+(iy+ro-f)+'px;left:'+(ix+iw-ro)+'px;width:'+ro+'px;height:'+(ih-ro-ro+f+f)+'px;"><v:fill method="'+(linear?"sigma":"linear")+'" type="gradient" angle="270" color="#'+sac+'" opacity="0" color2="#'+sac+'" o:opacity2="'+sao+'" /></v:rect>';	
						ishade += '<v:rect strokeweight="0" filled="t" stroked="f" fillcolor="#000000" style="position:absolute;margin: -1px 0 0 -1px;top:'+(iy+ih-ro)+'px;left:'+(ix+ro-f)+'px;width:'+(iw-ro-ro+f+f)+'px;height:'+ro+'px;"><v:fill method="'+(linear?"sigma":"linear")+'" type="gradient" angle="180" color="#'+sac+'" opacity="0" color2="#'+sac+'" o:opacity2="'+sao+'" /></v:rect>';	
						oline = '<v:roundrect arcsize="'+outer+'%" filled="f" stroked="t" style="zoom:1;margin:-1px 0 0 -1px;padding:0;position:absolute;top:'+iy+'px;left:'+ix+'px;width:'+iw+'px;height:'+ih+'px;"><v:stroke weight="1" style="single" color="#'+sac+'" opacity="'+sao+'" /></v:roundrect>';
					}
					if(!noshine) {
						ishine = '<v:roundrect arcsize="'+inner+'" strokeweight="0" filled="t" stroked="f" fillcolor="#ffffff" style="zoom:1;margin:-1px 0 0 -1px;padding:0;position:absolute;top:'+(iy+(ri/2))+'px;left:'+(ix+(ri/2))+'px;width:'+(iw-ri)+'px;height:'+(ih-ri)+'px;"><v:fill method="linear sigma" type="gradient" angle="0" color="#'+sic+'" opacity="0" color2="#'+sic+'" o:opacity2="'+sio+'" /></v:roundrect>';
						r=Math.round(r); p = "m 0,"+r+" l 0,"+(ih-ri-r)+","+t+","+(ih-ri-r)+","+t+","+r+" qy "+r+","+t+" l "+(iw-ri-r)+","+t+" qx "+(iw-ri-t)+","+r+" l "+(iw-ri-t)+","+(ih-ri-r)+","+(iw-ri)+","+(ih-ri-r)+","+(iw-ri)+","+r+" qy "+(iw-ri-r)+",0 l "+r+",0 qx 0,"+r+" x e";
						high = '<v:shape strokeweight="0" stroked="f" filled="t" coordorigin="0,0" coordsize="'+(iw-ri)+','+(ih-ri)+'" path="'+p+'" style="zoom:1;margin:-1px 0 0 -1px;padding:0;position:absolute;top:'+(iy+(ri/2))+'px;left:'+(ix+(ri/2))+'px;width:'+(iw-ri)+'px;height:'+(ih-ri)+'px;"><v:fill method="linear sigma" type="gradient" angle="0" color="#'+sic+'" opacity="0" color2="#'+sic+'" o:opacity2="'+sio+'" /></v:shape>';
						left = '<v:oval stroked="f" strokeweight="0" style="zoom:1;margin:-1px 0 0 -1px;padding:0;position:absolute;top:'+(iy+(ri/8))+'px;left:'+(ix+(ri/8))+'px;width:'+ri+'px;height:'+ri+'px;"><v:fill method="any" type="gradientradial" focus="0" focussize="0,0" focusposition="0.5,0.5" on="t" color="#'+sic+'" opacity="0" color2="#'+sic+'" o:opacity2="'+sio+'" /></v:oval>';
						right = '<v:oval stroked="f" strokeweight="0" style="zoom:1;margin:-1px 0 0 -1px;padding:0;position:absolute;top:'+(iy+(ri/8))+'px;left:'+(ix+iw-(ri*1.125))+'px;width:'+ri+'px;height:'+ri+'px;"><v:fill method="any" type="gradientradial" focus="0" focussize="0,0" focusposition="0.5,0.5" on="t" color="#'+sic+'" opacity="0" color2="#'+sic+'" o:opacity2="'+sio+'" /></v:oval>';
					}
					head = '<v:group style="zoom:1;display:'+canvas.dpl+';margin:-1px 0 0 -1px;padding:0;position:relative;width:'+ww+'px;height:'+hh+'px;" coordsize="'+ww+','+hh+'"><v:rect strokeweight="0" filled="t" stroked="f" fillcolor="#ffffff" style="zoom:1;margin:-1px 0 0 -1px;padding:0;position:absolute;top:0px;left:0px;width:'+ww+'px;height:'+hh+'px;"><v:fill color="#ffffff" opacity="0.0" /></v:rect>';
					canvas.innerHTML = head+iglow+fill+ishade+ishine+high+left+right+oline+foot;
					if(typeof window[callback]==='function') {window[callback](canvas.id,'cvi_bevel');}
				}
			}else {
				if(canvas.tagName.toUpperCase() == "CANVAS" && canvas.getContext("2d")) {
					var glo = glow==0?0.33:glow/100, sio = shine==0?0.5:shine/100, sao = shade==0?0.5:shade/100, rdi = Math.max(Math.min(radius==0?0.2:radius/100,0.4),0.2);	
					var glc = getRGB(glowcolor.match(/^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)?glowcolor:'#000000');
					var sic = getRGB(shinecolor.match(/^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)?shinecolor:'#ffffff');
					var sac = getRGB(shadecolor.match(/^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)?shadecolor:'#000000');
					var bac = getRGB(backcolor.match(/^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)?backcolor:'#0080ff');
					var flc = getRGB(fillcolor.match(/^#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)?fillcolor:backcolor);
					var style='', r = Math.max(Math.min(rdi,0.4),0.2), otr = Math.round(Math.min(iw,ih)*r), mdr = Math.round(otr*0.8), inr = Math.round(mdr/2);
					if(noglow) {ix = 0; iy = 0; iw = ww; ih = hh; mdr = Math.round(Math.min(iw,ih)*r); inr = Math.round(mdr/2);} 
					var context = canvas.getContext("2d"), prepared=(context.getImageData?true:false), alternate=false;
					var img = new Image();
					img.onload = function() {
						if(prepared&&(typeof cvi_filter!='undefined')&&filter!=null&&filter.length>0) {ww=Math.round(ww); hh=Math.round(hh);
							var source=document.createElement('canvas'); source.height=hh+4; source.width=ww+4; var src=source.getContext("2d");
							var buffer=document.createElement('canvas'); buffer.height=hh; buffer.width=ww; var ctx=buffer.getContext("2d");
							if(src&&ctx) {alternate=true; ctx.clearRect(0,0,ww,hh); ctx.drawImage(img,0,0,ww,hh); 
								src.clearRect(0,0,ww+4,hh+4); src.drawImage(img,0,0,ww+4,hh+4); src.drawImage(img,2,2,ww,hh); 
								for(var i in filter) {cvi_filter.add(source,buffer,filter[i],ww,hh);}
							}
						}
						context.clearRect(0,0,ww,hh);
						context.globalCompositeOperation = "source-over";
						context.save();
						if(!noglow) applyGlow(context,0,0,ww,hh,otr,glo,glc);
						applyForm(context,ix,iy,iw,ih,mdr,true,r);
						context.clip();
						style = context.createLinearGradient(ix,iy,ix,iy+ih);
						style.addColorStop(0,'rgba('+bac+',1)');
						style.addColorStop(1,'rgba('+flc+',1)');
						context.fillStyle = style; context.fill();
						context.fillStyle = 'rgba(0,0,0,0)';
						context.fillRect(0,0,ww,hh);
						if(alternate) {
							context.drawImage(source,2,2,ww,hh,0,0,ww,hh);
						}else {
							context.drawImage(img,0,0,ww,hh);
						}
						if(usemask) {
							context.globalCompositeOperation = "destination-out";
							applyMask(context,ix,iy,iw,ih,mdr,1,'0,0,0');
							context.globalCompositeOperation = "destination-over";
							context.fillStyle = style;
							context.beginPath(); context.rect(ix,iy,iw,ih);
							context.closePath(); context.fill();
						}
						if(!noshade) {
							context.globalCompositeOperation = window.opera?"source-over":"source-atop";
							context.fillStyle = 'rgba(0,0,0,0)'; context.fillRect(ix,iy,iw,ih);
							applyMask(context,ix,iy,iw,ih,mdr,sao,sac,false,linear);
							applyForm(context,ix,iy,iw,ih,mdr,true,r);
							context.strokeStyle = 'rgba('+sac+','+sao+')';
							context.lineWidth = 1; context.stroke();
						}
						if(!noshine) {
							context.globalCompositeOperation = window.opera?"source-over":"source-atop";
							applyForm(context,ix+inr,iy+inr,iw-mdr,ih-mdr,inr);
							if(!window.opera) {context.globalCompositeOperation = "lighter"; sio = sio*0.5; }
							style = context.createLinearGradient(0,inr,0,ih-mdr);
							style.addColorStop(0,'rgba('+sic+','+sio+')');
							style.addColorStop(0.25,'rgba('+sic+','+(sio/2)+')');
							style.addColorStop(1,'rgba('+sic+',0)');
							context.fillStyle = style; context.fill();
							applyForm(context,ix+inr,iy+inr,iw-mdr,ih-mdr,inr);
							style = context.createLinearGradient(0,inr,0,ih-mdr);
							style.addColorStop(0,'rgba('+sic+','+(sio*1.25)+')');
							style.addColorStop(0.25,'rgba('+sic+','+(sio/1.5)+')');
							style.addColorStop(1,'rgba('+sic+',0)');
							context.lineWidth = Math.max(Math.round(iw/200),0.5);
							context.strokeStyle = style; context.stroke();				
							applyFlex(context,ix+inr,iy+inr,iw-mdr,ih-mdr,inr,sio,sic);
						}
						context.restore();
						if(typeof window[callback]==='function') {window[callback](canvas.id,'cvi_bevel');}
					}
					img.src = canvas.source;
				}
			}
		} catch (e) {
		}
	},
	
	replace : function(canvas) {
		var object = canvas.parentNode; 
		var img = document.createElement('img');
		img.id = canvas.id;
		img.alt = canvas.alt;
		img.title = canvas.title;
		img.src = canvas.source;
		img.className = canvas.className;
		img.height = canvas.height;
		img.width = canvas.width;
		img.style.cssText = canvas.style.cssText;
		img.style.height = canvas.height+'px';
		img.style.width = canvas.width+'px';
		object.replaceChild(img,canvas);
	},

	remove : function(canvas) {
		if(document.all && document.namespaces && !window.opera) {
			if(canvas.tagName.toUpperCase() == "VAR") {
				cvi_bevel.replace(canvas);
			}
		}else {
			if(canvas.tagName.toUpperCase() == "CANVAS") {
				cvi_bevel.replace(canvas);
			}
		}
	}
}