var previewui=function(dom,s,sets,ui,onDataChange) {

	var ElementOfFile;
	var doc;
	var head;
	var builddoc=function() {
		ElementOfFile={};
    	var startidx=s.file.name.lastIndexOf("\/")+1;
    	var endidx=s.file.name.lastIndexOf(".");
    	var funcname=s.file.name.substring(startidx,endidx);
    
    	var projectJSON=childwithkv(s.files,"name","project.json").data;
    	var project;
    	try {
    		project=JSON.parse(projectJSON);
    	} catch(e) {
    		console.log(e);
    	}
    	var projectbase="projects/"+project.name+"/";
    
    	var jshtml="\
<!DOCTYPE html><html lang=\"en\"><head><title></title><meta charset=\"utf-8\">\
<base href=\""+projectbase+"\">\
<script src=\"node_modules/headjs/dist/1.0.0/head.load.js\"></script>\
<script type=\"application/javascript\">\
(function() {\n\
    var getJSON=function(filename,callback) {\n\
        var xobj = new XMLHttpRequest();\n\
        xobj.overrideMimeType('application/json');\n\
        xobj.open('GET', 'project.json', true);\n\
        xobj.onreadystatechange = function() {\n\
            if (xobj.readyState == 4 && xobj.status == '200')\n\
                callback(JSON.parse(xobj.responseText));\n\
        };\n\
        xobj.send(null);\n\
    };\n\
    getJSON('project.json',function(project) {\n\
	    head.load(project.deps,function() {\n\
            var fn="+funcname+";\n\
            var dom=$('body');\n\
            var m=Maggi.UI_devel(dom);\n\
            if (fn!==null) { fn(m,dom); }\n\
            else { dom.empty(); console.log('Maggi.IDE: function "+funcname+" was not defined'); }\n\
	    });\n\
    });\n\
})();\
</script></head><body></body></html>";


		doc.open();
		doc.write(jshtml);
		head=doc.head;
		if (s.file&&s.file.scope=="client") {
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
								head.insertBefore(x,sty);
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
		    if (iframe) { iframe[0].contentWindow.stop(); iframe.remove(); iframe=null;}
		    if (detached) {w.close(); w=null;}
		    if (s.detach) {
		        w=window.open();
		    } else {
            	iframe=$('<iframe>', {name:s.name}).appendTo(dom);
                w=iframe[0].contentWindow;
		    }
		    detached=s.detach;
		    doc=w.document;
		    builddoc();
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
		var sel,el;
		if ((file.type=="text/javascript")||(file.type=="application/javascript")) {
			sel='script[src="'+file.name+'"]';
			el = doc.querySelector(sel);
			ElementOfFile[file.name]=el;
			makedocument();
		}
		if (file.type=="text/css") {
			if (ElementOfFile[file.name]==null) {
				sel='link[href="'+file.name+'"]';
				el = doc.querySelector(sel);
				if (el==null) return;
				el.remove();
				el=doc.createElement("style");
				el.id=file.name;
				el.type=file.type;
				head.appendChild(el);
				ElementOfFile[file.name]=el;
			}
			ElementOfFile[file.name].innerHTML=file.data;
		}
	};

	var sethandler=function(k,v) {
		if (k=="reload") to();
		if (k=="detach") to();
		if (k=="file") to();
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

