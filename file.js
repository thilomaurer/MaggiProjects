var listui=function() { 
	return { 
		type:"list",
		childdefault:listitemui,
		select:"single",
		selected:"",
		class:"selectable tablegrid",
		builder:function(dom,data,ui) {
			var empty=(data==null);
			if (empty) empty=(Object.keys(data).length==0);
			if (empty) dom.text("empty");
		}
	};
};

var listitemui=function() {
	return {
		children:{
			type: {type:"image",urls:{"text/javascript":"icons/js.svg","text/html":"icons/html5.svg","text/css":"icons/css3.svg","text":"icons/text.svg",plus:"icons/plus.svg"}},
			name: {type:"text"},
		},
		class:"listitem"
	};
};

var filedata=function(o) {
	var fd={name:null,type:null,data:null,cursor:{row:0,column:0}};
	$.extend(fd,o);
	return Maggi(fd);
}

var filesui=function() { 
	var ui=listui();
	ui.childdefault=fileui;
	ui.builder=function(dom,data,ui) {
		ui.children.bind("set",function(k,v) {
			if (k[1]=="editvisible"&&v==true) {
				k=k[0];
				makeFileEditor($('body'),data[k],function(newdata) {
					data[k]=newdata;
				},function() { 
					data.remove(k); 
				},function() { 
					ui.children[k].editvisible=false; 
				});
			}
		});
	}
	return ui;
};

var fileui=function() {
	var ui=listitemui();
	ui.children.details={type:"label", class:"icon info", label:"\u00A0"};
	ui.editvisible=false;
	ui=Maggi(ui);
	ui.builder=function(dom,data,ui) {
		dom.ui.details.click(function() {
			ui.editvisible=true;
			return false;
		});
	};
	return ui;
};

var fileeditui=function() {

	var loc = function(dom,data,setdata,ui,datachange) {
		var text="empty file";
		if (data!=null)
			text=data.length+" characters, " + data.split("\n").length + " lines";
		dom.text(text);
	};

	return {
		children:{
			type: {type:"select",choices:{"text/javascipt":{label:"JS"},"text/html":{label:"HTML"},"text/css":{label:"CSS"},"text":{label:"TXT"}},class:"fillhorizontal"},
			name: {type:"input",placeholder:"filename"},
			cursor: {
				children: {
					label:{type:"label",label:"cursor position: line "},
					row:"text",
					label2:{type:"label",label:", column "},
					column:"text"
				}
			},
			data:{type:"user",user:loc},
		},
		class:"fileedit",
		builder:function(dom,data,ui) {
			if (data==null) 
				dom.text("<no file>");
		}
	};
};

var makeFileEditor=function(dom,file,setfile,onRemove,onClose) {
	var data=Maggi({
		delete:function() { 
			onRemove();
			data.close();
		},
		close:function() { 
			removeOverlay();
			if (onClose) onClose();
		},
		data:file,
		upload:null
	});
	var validfile=function(k,v) {
		return data.data.name!="";
	};
	var ui=Maggi({
		type:"object",
		class:"popup",
		children: {
			//title:{type:"label", label:"File Settings"},
			data:fileeditui,
			close:{type:"function",class:"right button",label:"Done",enabled:false},
			upload:{type:"user",user:fileinput},
			delete:{type:"function",class:"left button red",label:"Delete File"},
		},
		builder: function(dom,data,ui) {
			dom.parent().addClass("mui-light");
			data.bind("set","upload",function(k,v) {
				data.data={name:v.name,type:v.mimeType,data:v.data,cursor:{row:0,column:0}};
				setfile(data.data);
			});
			var validate=function() {
				ui.children.close.enabled=validfile(data.file);
			};
			data.data.bind("set",validate);
			validate();
		}
	});
	var removeOverlay=Maggi.UI.overlay(dom,data,ui);
};

var fileinput=function(dom,data,setdata,ui) {
    m=Maggi.UI_devel(dom);

	m.data={
		select:function() {dom.ui.i._Maggi.click();},
		i:"",
	};
	
	m.ui={
		children: {
			i: {type:"input", kind:"file", visible:false},
			select: {type:"function", label:"Upload File", class:"button"},
		},
		builder: function(dom) {
            dom.ui.i.change(function(evt) {
                var f=evt.target.files[0];
                var reader = new FileReader();
                reader.onload = function(e) {
                    setdata({
                        name:f.name,
                        mimeType:f.type,
                        size:f.size,
                        data:reader.result
                    });
                };
                reader.readAsText(f);
		    });
		}
	};
}
