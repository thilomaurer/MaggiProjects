var main = function() {

	var filesui=function() { 
		return Maggi({ 
			type:"list",
			childdefault:fileui,
			select:"single",
			selected:""
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
			class:"myfile",
		});
	}

	var data = function() {

		var currentfiles=Maggi({});

		var panedata=function() {
			var p=Maggi({
				file:{name:"<unnamed>"},
				filepopup:currentfiles,
				mode:"code",
				editor:{text:"",cursor:{row:0,column:0}},
				menu:"☰",
				actions: {},
				preview: {
					name: null,
					html: null,
					head: {},
					styles: {}, 
					scripts: {},
					file: null,
					files: currentfiles
				}
			});
			p.actions.add("renamefile",function() {
				var f=p.file;
				var newname=prompt("Please enter new name for file '"+f.name+"'", f.name);
				f.name=newname;
				//p.actions.visible
			});
			return p;
		}

		var addpane=function() {
			var n=Object.keys(data.panes).length;
			var pane=panedata();
			data.panes.add(n,pane);
			return pane;
		};

		var removeallpanes=function() {
			for (k in data.panes) {
				data.panes.remove(k);
			}
		}

		var data=Maggi({
			projectname: null,
			project: null,
			projects: {},
			addpane: addpane,
			panes: {}
		});

		var closeproject = function() {
			removeallpanes();
			for (k in currentfiles) {
				currentfiles.remove(k);
			}
			data.projectname=null;
		}

		var loadproject = function() {
			closeproject();
			
			var view=data.project.view;
			var revid=view.revision;
			var rev=data.project.revisions[revid];
			data.projectname=rev.name;
			for (var idx in rev.fileids) {
				var id=rev.fileids[idx];
				var file=data.project.files[id][revid];
				currentfiles.add(id,file);
			}
			for (var idx in view.panes) {
				var p=view.panes[idx];
				var pane=addpane();
				pane.mode=p.mode;
				pane.file=currentfiles[p.fileid];
			}
		}

		data.bind(function(k,v) {
			if (k=="project") loadproject();
		});

		data.panes.bind("add",function(k,v) {
			if (k instanceof Array) return;
			v.actions.add("closepane",function() {data.panes.remove(k);});
		});
		addpane();

		//add demo project
		var project=Maggi({
			revisions:{
				1:{
					name:"Password Calculator",
					date:"August 14th 2015, 21:38",
					committer:"Thilo Maurer",
					parentrevision:null,
					fileids:[0,1,2,3,4,5,6,7]
				}
			},
			files: { //files.id.revision
				//0: { 1: { name:"file.js", type:"js", data:"...", line: 1, column:1}}
			},
			view:{
				revision:1,
				panes:{
					1:{fileid:4,mode:"code"},
					2:{fileid:6,mode:"preview"}
				}
			}
		});

		var fillprojectfiles = function(complete) {
			var sources = [
				"jquery-2.0.3.js",
				"Maggi.js",
				"Maggi.UI.js",
				"Maggi.UI.css",
				"demos/pwcalc.js",
				"demos/pwcalc.css",
				"demos/pwcalc.html",
				"demos/utils.js"
                        ];
			var files=project.files;
			$.each(sources, function(idx,k) {
				var parts=k.split(".");
				var type="text";
				if (parts.length>0) type=parts[parts.length-1];
				$.get( k, null, function(data) {
					var revision={1:{name:k,type:type,data:data,line:1,column:1}};
					files.add(idx, revision);
				},"text");
			});
			files.bind("add",function(k,v) {
				if (Object.keys(files).length==sources.length) complete();
			});
		}

		fillprojectfiles(function() {
			data.projects.add(0,project);
			data.project=project;
		});


		return data;
	};

	var d=data();

	Maggi.UI.code=function(dom,data,setv,ui) {
		var editor=dom._Maggi;
		if (!editor) {
			Maggi.UI.BaseFunctionality(dom,ui);
			
			var d=Maggi({editor:"",annot:{}});
			var fmt=Maggi({
				type:"object",
				children: {
					editor:{type:"text"},
					annot:{
						type:"list",
						childdefault:{
							type:"object",
							order:["type","row","column","text"]
						},
						select:"single",
						selected:null, 
						class:"scroll"
					}
				}
			});
			Maggi.UI(dom,d,fmt);
			
			editor = ace.edit(dom.ui.editor[0]);

			function updateMode() {
				var mode="text";
				if (ui.mode=="js") mode="javascript";
				if (ui.mode=="css") mode="css";
				if (ui.mode=="html") mode="html";
				editor.getSession().setMode("ace/mode/"+mode);
			}

			ui.bind(function(k,v) {
				if (k=="mode") updateMode();
			});
			editor.setTheme("ace/theme/xcode");
			updateMode();
			editor.on("change", function(e) {
				if (!dom._MaggiDisableEvents) data.text=editor.getValue();
	 		});
			editor.getSession().selection.on('changeCursor', function() {
				data.cursor=editor.getCursorPosition();
	 		});
			editor.getSession().on("changeAnnotation", function() {
				d.annot = editor.getSession().getAnnotations();
			});	
			dom._Maggi=editor;
			dom._MaggiDisableEvents=false; //hack to work around ACE issue.
		}
		var updateText = function() {
			if (editor.getValue()==data.text) return;
			dom._MaggiDisableEvents=true; //hack to work around ACE issue.
			var pos=editor.getCursorPosition();
			editor.setValue(data.text);
			editor.moveCursorToPosition(pos);
			dom._MaggiDisableEvents=false;

		}
		var updateCursor = function() {
			var op=editor.getCursorPosition();
			if ((data.cursor.row==op.row)&&(data.cursor.column==op.column)) return;
			console.log(JSON.stringify(data.cursor));
			editor.moveCursorToPosition(data.cursor);
		};
		data.bind(function(k,v) {
			if (k=="text") updateText();
			if (k=="cursor") updateCursor();
		});
		updateText();
	};


	var paneui = function() {
		var fui=filesui();
		fui.add("popup",true);
		fui.add("popuptrigger","file");
		return Maggi({
			type:"object",
			children:{
				file:fileui,
				filepopup:fui,
				mode:{type:"select",choices:["code","preview"],class:"items2"},
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
				editor: {type:"code",mode:""},
				preview: {type:"iframe"}
			},
			order:[],
			class:"pane",
			builder:function(dom,data,ui) {
				ui.children.filepopup.bind(function(k,v) {
					var openfile = function(file) {
						if (file.type!="directory") {
							data.file=file;
							ui.children.filepopup.visible=false;
						}
					};
					if (k instanceof Array) {
						var N=k.length;
						if (k[N-1]!="selected") return;
						var root=data.filepopup;
						for (var i=1;i<N-1;i+=2) root=root[k[i]];
						openfile(root[v]);
					}
					if (k=="selected") openfile(data.filepopup[v]);
				});
				var modeorder={
					code:["file","filepopup","mode","menu","actions","editor"],
					preview:["file","filepopup","mode","menu","actions","preview"]
				};
				var updateFileData = function() {
					var d=data.file.data;
					data.editor.text=d;
				};
				var updateFile = function() {
					ui.children.editor.mode=data.file.type;
					data.preview.file=data.file;
					updateFileData();
				};
				data.bind(function(k,v) {
					if (k=="file") updateFile();
					if (k[0]=="file"&&k[1]=="data") updateFileData();
					if (k[0]=="editor"&&k[1]=="text") data.file.data=v;
					if (k=="mode") ui.order=modeorder[v];
				});
				ui.order=modeorder[data.mode];
			}
		});
	}
	

	var ui = function() {
		return {
			type:"object",
			children:{
				projectname: {type: "text"},
				addpane: {type:"function",label:"Add Pane"},
				panes: { 
					type:"object",
					childdefault: paneui,
				}
			},
			class:"ide"
		};
	};

	var dom=$('body');
	Maggi.UI(dom,d,ui);
}
