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
	return p;
};

var buildFilesEdit = function(dom,data,ui) {
	var int_data=Maggi({
		files:data,
		actions:{
			adder:{type:"plus",name:"Add File..."}
		},
	});
	var int_ui={
		visible:false,
		children: {
			actions:listui(),
			filesLabel:{type:"label",label:"FILES", class:"listlabel"},
			files: filesui(),
		},
		builder:function(dom,int_data,int_ui) {
			int_ui.children.actions.bind("set","selected",function(k,v) {
				if (v=="adder") {
					var k=ui.addfile({name:""});
					int_ui.children.files.children[k].editvisible=true;
				}
				int_ui.children.actions.selected=null;
			});
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
			file:listitemui,
			files:{
				popup:true,
				popuptrigger:"file",
				order:[],
				builder:buildFilesEdit,
				selected:null,
			},
			mode:{type:"select",choices:{edit:{label:"edit"},preview:{label:"preview"}}},
			options:{type:"label",class:"options icon"},
			actions: {
				popup:true, popuptrigger:"options",
				children: {
					closepane:{type:"function",label:"close pane", class:"button red"},
					insertpane:{type:"function",label:"insert pane", class:"button"},
				}
			},
			editor_actions:{data:{},children:{}},
			preview_actions:{
				data:{},
				children:{
					detach:{type:"label",class:"detach icon"}
				}
			}
		},
		order: ["options","editor_actions","preview_actions","file","files","mode","actions","editor","preview"],
		class:"paneheader",
		builder:function(dom,data,ui) {
			ui.children.files.addfile=data.addfile;
			var updateSelected=function(k,v) {
				data.file=data.files[v];
			};
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
				[data,"set", "mode", updateMode],
				[ui.children.files,"set","selected",updateSelected]
			];
			return installBindings(handlers);
		}
	});
}

var installBindings=function(handlers) {
	$.each(handlers,function(idx,v) {
		var o=v[0];
		var e=v[1];
		var k=v[2];
		var f=v[3];
		o.bind(e,k,f);
		f(k,o[k]);
	});
	return function() {
		$.each(handlers,function(idx,v) {
			var o=v[0];
			var e=v[1];
			var k=v[2];
			var f=v[3];
			o.unbind(e,k,f);
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
				[data,"set", "file", updateFile],
				[data,"set", "mode", updateMode]
			];
			return installBindings(handlers);
		}
	};
}
