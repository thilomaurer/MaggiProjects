var filesui=function() { 
	return Maggi({ 
		type:"list",
		childdefault:fileui,
		select:"single",
		selected:"",
		class:"selectable table",
		builder:function(dom,data,ui) {
			var empty=(data==null);
			if (empty) empty=(Object.keys(data.files).length==0);
			if (empty) dom.text("<no files>");
		}
	});
};

var fileui=function() {
	return Maggi({
		children:{
			type: {type:"image",urls:{js:"icons/js.svg",html:"icons/html5.svg",css:"icons/css3.svg",plus:"icons/plus.svg"}},
			name: {type:"text"},
		},
		order:["type","name"],
		class:"file",
		builder:function(dom,data,ui) {
			if (data==null) 
				dom.text("<no file>");
		}
	});
};

var listentryui=function() {
	return Maggi({
		children:{
			type: {type:"image",urls:{js:"icons/js.svg",html:"icons/html5.svg",css:"icons/css3.svg"}},
			name: {type:"text"},
		},
		order:["type","name"],
		class:"file",
		builder:function(dom,data,ui) {
			if (data==null) 
				dom.text("<empty>");
		}
	});
};

var panedata=function() {
	var files=Maggi({});
	var f={name:"<unnamed>",type:"text",data:"",cursor:{row:0,column:0}};
	var p=Maggi({
		file:f,
		files:files,
		mode:"edit",
		edit:{file:f},
		actions: {},
		preview: {
			detach: false,
			file: null,
			files: files
		}
	});
	p.bind(function(k,v) {
		if (k=="files") p.preview.files=v;
	});
	p.actions.add("closepane",function() {
		p.trigger("closepane");
	});
	p.actions.add("insertpane",function() {
		p.trigger("insertpane");
	});
	p.actions.add("renamefile",function() {
		var f=p.file;
		var newname=prompt("Please enter new name for file '"+f.name+"'", f.name);
		if (newname!=null) f.name=newname;
	});
	return p;
};

var buildFilesEdit = function(dom,data,ui) {
	var int_data=Maggi({
		files:data,
		actions:{
			adder:{type:"plus",name:"Create New File..."}
		},
	});
	var int_ui={
		visible:false,
		children: {
			actions:filesui(),
			filesLabel:{type:"label",label:"FILES", class:"listlabel"},
			files: filesui(),
		},
		builder:function(dom,int_data,int_ui) {
			int_ui.children.files.bind("set",function(k,v) {
				var openfile = function(file) {
					if (file.type!="directory") {
						ui.selected=v;
						ui.visible=false;
					}
				};
				if (k=="selected") openfile(v);
			});
		}
	};
	return Maggi.UI(dom,int_data,int_ui);
};

var paneuiheader = function() {
	return Maggi({
		children:{
			file:fileui,
			files:{
				popup:true,
				popuptrigger:"file",
				order:[],
				builder:buildFilesEdit,
				selected:null,
			},
			mode:{type:"select",choices:{edit:{label:"edit"},preview:{label:"preview"}}},
			options:{type:"label",class:"icon"},
			actions: {
				popup:true, popuptrigger:"options",
				children: {
					closepane:{type:"function",label:"close pane", class:"button blue"},
					insertpane:{type:"function",label:"insert pane", class:"button blue"},
					renamefile:{type:"function",label:"rename file", class:"button blue"}
				}
			},
			editor_actions:{data:{},children:{}},
			preview_actions:{
				data:{},
				children:{
					detach:{type:"label",class:"icon"}
				}
			}
		},
		order: ["options","editor_actions","preview_actions","file","files","mode","actions","editor","preview"],
		class:"paneheader",
		builder:function(dom,data,ui) {
			ui.children.files.bind("set","selected",function(k,v) {
				data.file=data.files[v];
			});
			dom.ui.actions.ui.closepane.click(function() {
				ui.children.actions.visible=false;
			});
			dom.ui.actions.ui.insertpane.click(function() {
				ui.children.actions.visible=false;
			});
			dom.ui.preview_actions.ui.detach.click(function() {
				data.preview.detach=!data.preview.detach;
			});
			var updateMode = function(k,v) {
				var p=(v=="preview");
				var e=(v=="edit");
				ui.children.editor_actions.add("visible",e);
				ui.children.preview_actions.add("visible",p);
				if (p) { 
					var dc=ui.children.preview_actions.children.detach;
					data.preview.bind("set","detach",function(k,v) {
						if (v) dc.class="icon activated"; else dc.class="icon";
					});
				}
			};
			
			var handlers=[
				["set", "mode", updateMode]
			];
			return installBindings(data,handlers);
		}
	});
}

var installBindings=function(o,handlers) {
	$.each(handlers,function(idx,v) {
		o.bind.apply(null,v);
		v[2](v[1],o[v[1]]);
	});
	return function() {
		$.each(handlers,function(idx,v) {
			o.unbind.apply(null,v);
		});
	};
};

var paneui = function() {
	return {
		children:{
			header:paneuiheader(),
			preview:{type:"iframe"},
			edit:{type:"editor"}
		},
		order:["header","edit"],
		class:"pane tablerows",
		builder: function(dom,data,ui) {
			ui.children.header.add("data",data);
			var updateMode = function(k,v) {
				ui.order=["header",v];
			};
			var updateFile = function(k,v) {
				data.preview.file=v; 
				data.edit.file=v;
			};
			var handlers=[
				["set", "file", updateFile],
				["set", "mode", updateMode]
			];
			return installBindings(data,handlers);
		}
	};
}
