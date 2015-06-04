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
		type:"object",
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
		menu:"☰",
		actions: {},
		preview: {
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
		//p.actions.visible=false;
	});
	return p;
};

var paneui = function() {
	var fui=filesui();
	fui.add("popup",true);
	fui.add("popuptrigger","file");
	return Maggi({
		type:"object",
		children:{
			file:fileui,
			files:fui,
			mode:{type:"select",choices:{edit:{label:"edit"},preview:{label:"preview"}}},
			menu:{type:"text",class:"icon"},
			actions: {
				type:"object",
				popup:true, popuptrigger:"menu",
				children: {
					close:{type:"function",label:"close pane", class:"button blue"},
					renamefile:{type:"function",label:"rename file", class:"button blue"}
					
				}
			},
			editor_actions:{type:"object",children:{},visible:true},
			preview_actions:{
				type:"object",
				data:{},
				children:{
					detach:{type:"label",class:"icon"}
				},
				visible:true	
			}
		},
		order: ["menu","editor_actions","preview_actions","file","files","mode","actions","editor","preview"],
		class:"pane",
		builder:function(dom,data,ui) {
			/*ui.children.preview.bind("set","detach",function(k,v) {
				ui.children.preview_actions.children.preview_detach.label=v?"attach":"detach";
			});*/
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
				ui.children.preview.detach=!ui.children.preview.detach;
			});
			var updateFile = function(k,v) {
				data.preview.file=v; 
				data.editor.file=v;
			};
			var updateMode = function(k,v) {
				var p=(v=="preview");
				var e=(v=="edit");
				ui.children.editor_actions.visible=e;
				ui.children.preview_actions.visible=p;
				if (p) { 
					ui.children.remove("editor"); 
					ui.children.add("preview",{type:"iframe"});
					var dc=ui.children.preview_actions.children.detach;
					ui.children.preview.bind("set","detach",function(k,v) {
						if (v) dc.class="icon activated"; else dc.class="icon";
					});
				}
				if (e) { 
					ui.children.remove("preview"); 
					ui.children.add("editor",{type:"editor"});
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
