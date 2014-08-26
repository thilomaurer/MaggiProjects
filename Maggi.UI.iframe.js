/*!
 * Maggi.UI.js JavaScript Library 
 * https://home.thilomaurer.de/Maggi.js
 *
 * Copyright (C) 2014-05-22 Thilo Maurer
 * All Rights Reserved.
 * 
 */

Maggi.UI.iframe=function(ui,s,sets,format) {
	var ElementOfFile;
	var makedocument = function() {
		ElementOfFile={};
		var doc=document.implementation.createHTMLDocument();
		doc.open();
		if (s.file) if (s.file.type=="html") {
			doc.write(s.file.data);
			var scripts=doc.scripts;
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
		doc.close();

		var cw=iframe[0].contentWindow;
		if (cw) {
			var d=cw.document;
			if (d) {
				d.open();
				d.write(doc.documentElement.outerHTML);
				d.close();
			} 
		} else console.log("iframe has no contentWindow");
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

