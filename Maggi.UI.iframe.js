/*!
 * Maggi.UI.js JavaScript Library 
 * https://home.thilomaurer.de/Maggi.js
 *
 * Copyright (C) 2014-05-22 Thilo Maurer
 * All Rights Reserved.
 * 
 */

Maggi.UI.iframe=function(dom,s,sets,ui,onDataChange) {

	var jshtml="<!DOCTYPE html><html lang=\"en\"><head><title></title><meta charset=\"utf-8\"></head><body></body></html>";

	var ElementOfFile;
	var builddoc=function(doc) {
		ElementOfFile={};
		doc.open();
		if (s.file&&s.file.scope=="client") { 
			if (s.file.type=="text/javascript"||s.file.type=="application/javascript") {
				doc.write(jshtml);
				var head=doc.getElementsByTagName('head').item(0);
				for (var idx in s.files) {
					var file=s.files[idx];
					if (file.scope=="client") {
    					var el=null;
    					if (file.type=="text/javascript"||file.type=="application/javascript") {
    						el=document.createElement('script');
    						el.type=file.type;
    					}	
    					if (file.type=="text/css") {
    						el=document.createElement("style");
    						el.type=file.type;
    					}
    					if (el!==null) {
    						el.id=file.name;
    						el.innerHTML=file.data;
    						head.appendChild(el);
    						ElementOfFile[file.name]=el;
    					}
					}
				}
				var el=document.createElement('script');
				el.type='text/javascript';
				//el.innerHTML="$(document).ready("+s.file.name+");";
				var startidx=s.file.name.lastIndexOf("\/")+1;
				var endidx=s.file.name.lastIndexOf(".");
				var funcname=s.file.name.substring(startidx,endidx);
				el.innerHTML="$(document).ready(function() { var fn="+funcname+"; var dom=$('body'); var m=Maggi.UI_devel(dom); if (fn!=null) { fn(m,dom); } else { dom.empty(); console.log('Maggi.IDE: function "+funcname+" was not defined');}});";
				head.appendChild(el);
			}
			if (s.file.type=="text/html") {
				doc.write(s.file.data);
				var scripts=doc.scripts;
				//replace loaded scripts with live ones from ide
				for (var sidx=0;sidx<scripts.length;sidx++) {
					var scr=scripts[sidx];
					for (var fidx in s.files) {
						var name=s.files[fidx].name;
						if (document.URL+name==scr.src) {
							ElementOfFile[name]=scr;
							scr.removeAttribute("src");
							scr.id=name;
							scr.innerHTML=s.files[fidx].data;
						}
					}
				}
				var styles=[];
				//replace loaded style-sheets with live ones from ide
				for(var els = doc.getElementsByTagName ('link'), i = els.length; i--;) {
					var sty=els[i];
					if (sty.rel  == "stylesheet") {
						for (var fidx in s.files) {
							var name=s.files[fidx].name;
							if (document.URL+name==sty.href) {
								ElementOfFile[name]=sty;
								var x=document.createElement("style");
								x.id=name;
								x.type=sty.type;
								x.innerHTML=s.files[fidx].data;
								doc.head.insertBefore(x,sty);
								sty.remove();
							}
						}
					
					}
				}

				for (var sidx=0;sidx<styles.length;sidx++) {
					var scr=styles[sidx];
				}
			}
		}
		doc.close();
	};

	var iframe,w,detached=false;
	var to = function() {
	    var now=new Date().getTime();
	    var make=(maketime<=now);
	    if (make) {
		    if (iframe) {iframe.remove(); iframe=null;}
		    if (detached) {w.close(); w=null;}
		    if (s.detach) {
		        w=window.open();
		    } else {
            	iframe=$('<iframe>', {name:s.name}).appendTo(dom);
                w=iframe[0].contentWindow;
		    }
		    detached=s.detach;
		    builddoc(w.document);
	    }
	};
	
	var latency=1000;
	var maketime=0;
	var makedocument = function() {
	    var now=new Date().getTime();
	    maketime=now+latency;
        setTimeout(to,latency);
	};


	var updateFile = function(file) {
		var el=ElementOfFile[file.name];
		if (!el) return;
		el.innerHTML=file.data;
		//if JS changed reload
		if ((file.type=="text/javascript")||(file.type=="application/javascript"))
		  makedocument();
	};

	var sethandler=function(k,v) {
		if (k=="reload") to();
		if (k=="detach") makedocument();
		if (k=="file") makedocument();
		if (k[0]=="files"&&k[2]=="data") updateFile(s.files[k[1]]);
	};

	backbuild_base=Maggi.UI.BaseFunctionality(dom,s,sets,ui,onDataChange);

	s.bind("set", sethandler); 

	if (s.detach===null) s.add("detach",false);
	to();

	var unbind = function() {
		s.unbind(sethandler);

		backbuild_base();
	};
	return unbind;
};

