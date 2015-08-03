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
			type: {type:"image",urls:{js:"icons/js.svg",html:"icons/html5.svg",css:"icons/css3.svg",plus:"icons/plus.svg"}},
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
				makeFileEditor($('body'),data[k],function() { 
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
		if (data==null)
			dom.text="empty file";
		else
			dom.text(data.length+" characters, " + data.split("\n").length + " lines");
	};
	return {
		children:{
			type: {type:"select",choices:{js:{label:"JS"},html:{label:"HTML"},css:{label:"CSS"}},class:"fillhorizontal"},
			name: {type:"input",placeholder:"filename"},
			cursor: {
				children: {
					label:{type:"label",label:"cursor position: line "},
					row:"text",
					label2:{type:"label",label:", column "},

					column:"text"
				}
			},
			data:{type:"user",user:loc}
		},
		class:"fileedit",
		builder:function(dom,data,ui) {
			if (data==null) 
				dom.text("<no file>");
		}
	};
};

var makeFileEditor=function(dom,file,onRemove,onClose) {
	var data=Maggi({
		delete:function() { 
			onRemove();
			data.close();
		},
		close:function() { 
			removeOverlay();
			if (onClose) onClose();
		},
		data:file
	});
	var ui=Maggi({
		type:"object",
		class:"popup",
		children: {
			title:{type:"label", label:"File Settings"},
			data:fileeditui,
			close:{type:"function",class:"right button",label:"Done"},
			delete:{type:"function",class:"left button red",label:"Delete File"},
		},
		builder: function(dom,data,ui) {
			var update=function(k,v) {
				ui.children.close.visible=data.data.valid;
			};
			data.data.bind("set","valid",update);
			update();
			dom.parent().addClass("mui-light");
		}
	});
	var removeOverlay=Maggi.UI.overlay(dom,data,ui);
};
