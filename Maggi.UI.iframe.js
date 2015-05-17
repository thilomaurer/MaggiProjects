/*!
 * Maggi.UI.js JavaScript Library 
 * https://home.thilomaurer.de/Maggi.js
 *
 * Copyright (C) 2014-05-22 Thilo Maurer
 * All Rights Reserved.
 * 
 */

Maggi.UI.iframe=function(ui,s,sets,format) {

	var jshtml="<!DOCTYPE html><html lang=\"en\"><head><title></title><meta charset=\"utf-8\"></head><body></body></html>";

	var ElementOfFile;
	var builddoc=function(doc) {
		ElementOfFile={};
		doc.open();
		if (s.file) { 
			if (s.file.type=="js") {
				doc.write(jshtml);
				var head=doc.getElementsByTagName('head').item(0);
				for (var idx in s.files) {
					var file=s.files[idx];
					var el=null;
					if (file.type=="js") {
						el=document.createElement('script');
						el.type='text/javascript';
					}	
					if (file.type=="css") {
						el=document.createElement("style");
						el.type="text/css";
					}
					if (el!=null) {
						el.id=file.name
						el.innerHTML=file.data;
						head.appendChild(el);
						ElementOfFile[file.name]=el;
					}
				}
				var el=document.createElement('script');
				el.type='text/javascript';
				//el.innerHTML="$(document).ready("+s.file.name+");";
				var startidx=s.file.name.lastIndexOf("\/")+1;
				var endidx=s.file.name.lastIndexOf(".");
				var funcname=s.file.name.substring(startidx,endidx);
				el.innerHTML="$(document).ready(function() { var fn="+funcname+"; var dom=$('body'); if (fn!=null) { fn(dom); } else { dom.empty(); console.log('Maggi.IDE: function "+funcname+" was not defined');}});";
				head.appendChild(el);
			}
			if (s.file.type=="html") {
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
	function purge(d) {
		var a = Object.keys(d);
		for (var i = 0; i < a.length; i ++) {
			var n = a[i];
			d[n]=null;
			delete d[n];
		}
	}
	var makedocument = function() {
		//if (iframe!=null) iframe.remove();
		//iframe=$('<iframe>', {name:s.name}).appendTo(ui);
		var cw=iframe[0].contentWindow;
		purge(cw);
		builddoc(cw.document);
	};

	var updateFile = function(file) {
		var el=ElementOfFile[file.name];
		if (!el) return;
		el.innerHTML=file.data;
		//but el is in shadow document, not the live one.
		//just fully renew the live one for now
		makedocument();
	};

	var sethandler=function(k,v) {
		if (k=="file") makedocument();
		if (k[0]=="files"&&k[2]=="data") updateFile(s.files[k[1]]);
	};

	backbuild_base=Maggi.UI.BaseFunctionality(ui,format);
	var iframe=$('<iframe>', {name:s.name}).appendTo(ui);

	s.bind("set", sethandler); 
	s.bind("add", makedocument);
	var unbind = function() {
		s.unbind("set",sethandler);
		s.unbind("add",makedocument);
		backbuild_base();
	}
	makedocument();
	return unbind;
};

