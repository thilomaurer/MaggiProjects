var filesui=function() { 
	return Maggi({ 
		type:"list",
		childdefault:fileui,
		select:"single",
		selected:"",
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
			type: {type:"image",urls:{js:"icons/js.svg",html:"icons/html5.svg",css:"icons/css3.svg"}},
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

var panedata=function() {
	var files=Maggi({});
	var f={name:"<unnamed>",type:"text",data:"",cursor:{row:0,column:0}};
	var p=Maggi({
		file:f,
		files:files,
		mode:"edit",
		editor:{file:f},
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
	p.actions.add("close",function() {
		p.add("removenow",true);
	});
	p.actions.add("renamefile",function() {
		var f=p.file;
		var newname=prompt("Please enter new name for file '"+f.name+"'", f.name);
		if (newname!=null) f.name=newname;
	});
	return p;
};

var paneuiheader = function() {
	var fui=filesui();
	fui.add("popup",true);
	fui.add("popuptrigger","file");
	return Maggi({
		children:{
			file:fileui,
			files:fui,
			mode:{type:"select",choices:{edit:{label:"edit"},preview:{label:"preview"}}},
			options:{type:"label",class:"icon"},
			actions: {
				popup:true, popuptrigger:"options",
				children: {
					close:{type:"function",label:"close pane", class:"button blue"},
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
		order: ["a","options","editor_actions","preview_actions","file","files","mode","actions","editor","preview"],
		class:"paneheader",
		builder:function(dom,data,ui) {
			ui.children.files.bind(function(k,v) {
				var openfile = function(file) {
					if (file.type!="directory") {
						data.file=file;
						ui.children.files.visible=false;
					}
				};
				if (k instanceof Array) {
					var N=k.length;
					if (k[N-1]!="selected") return;
					var root=data.files;
					for (var i=1;i<N-1;i+=2) root=root[k[i]];
					openfile(root[v]);
				}
				if (k=="selected") openfile(data.files[v]);
			});
			dom.ui.preview_actions.ui.detach.click(function() {
				data.preview.detach=!data.preview.detach;
			});
			var updateFile = function(k,v) {
				data.preview.file=v; 
				data.editor.file=v;
			};
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
				["set", "file", updateFile],
				["set", "mode", updateMode]
			];
			updateMode("mode",data.mode);
			$.each(handlers,function(idx,v) {
				data.bind.apply(null,v);
			});
			return function() {
				$.each(handlers,function(idx,v) {
					data.unbind.apply(null,v);
				});
			};
		}
	});
}

var paneui = function() {
	return {
		children:{
			header:paneuiheader()
		},
		class:"pane tablerows",
		builder: function(dom,data,ui) {
			ui.children.header.add("data",data);
			var updateMode = function(k,v) {
				var p=(v=="preview");
				var e=(v=="edit");
				if (p) { 
					ui.children.remove("editor"); 
					ui.children.add("preview",{type:"iframe"});
				}
				if (e) { 
					ui.children.remove("preview"); 
					ui.children.add("editor",{type:"editor"});
				}
			};

			var handlers=[
				["set", "mode", updateMode]
			];
			updateMode("mode",data.mode);
			$.each(handlers,function(idx,v) {
				data.bind.apply(null,v);
			});
			return function() {
				$.each(handlers,function(idx,v) {
					data.unbind.apply(null,v);
				});
			};
		}
	};
}
