var main = function() {

	var data = function() {

		var files=Maggi({});

		var addpane=function() {
			var n=Object.keys(data.panes).length;
			var pane=panedata();
			pane.files=files;
			data.panes.add(n,pane);
			return pane;
		};

		var removeallpanes=function() {
			for (k in data.panes)
				data.panes.remove(k);
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
			for (k in files) files.remove(k);
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
				files.add(id,file);
			}
			for (var idx in view.panes) {
				var p=view.panes[idx];
				var pane=addpane();
				pane.mode=p.mode;
				pane.file=files[p.fileid];
			}
		}

		data.bind(function(k,v) {
			if (k=="project") loadproject();
		});

		data.panes.bind("add",function(k,v) {
			if (k instanceof Array) return;
			v.actions.add("closepane",function() {data.panes.remove(k);});
		});

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
					1:{fileid:4,mode:"edit"},
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
					var revision={1:{name:k,type:type,data:data,cursor:{row:0,column:0}}};
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

	var d = data();
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
