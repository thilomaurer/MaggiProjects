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
	p.actions.add("renamefile",function() {
		var f=p.file;
		var newname=prompt("Please enter new name for file '"+f.name+"'", f.name);
		f.name=newname;
		//p.actions.visible
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
			mode:{type:"select",choices:["edit","preview"],class:"items2"},
			menu:{type:"text"},
			actions: {
				type:"object",
				popup:"true", popuptrigger:"menu",
				children: {
					closepane:{type:"function",label:"close pane"},
					renamefile:{type:"function",label:"rename file"}
				}
			},
			closepane:{type:"function",label:"X"},
			editor: {type:"editor"},
			preview: {type:"iframe"}
		},
		order:[],
		class:"pane",
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
			var modeorder={
				edit:["file","files","mode","menu","actions","editor"],
				preview:["file","files","mode","menu","actions","preview"]
			};
			var updateFile = function() {
				data.preview.file=data.file; 
				data.editor.file=data.file;
			};
			var handlers={
				set:function(k,v) {
					if (k=="file") updateFile();
					if (k=="mode") ui.order=modeorder[v];
				}
			};
			data.bind(handlers.set);
			ui.order=modeorder[data.mode];
			return function() {
				data.unbind(handlers.set);
			};
		}
	});
}
