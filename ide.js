var main = function() {

	var data = function() {

		var addpane=function() {
			var n=Object.keys(data.panes).length;
			var pane=panedata();
			var rev=data.project.view.revision;
			pane.files=data.project.revisions[rev].files;
			data.panes.add(n,pane);
			return pane;
		};

		var removeallpanes=function() {
			for (k in data.panes)
				data.panes.remove(k);
		};

		var data=Maggi({
			projectname: null,
			project: null,
			projects: {},
			addpane: addpane,
			panes: {}
		});

		var loadproject = function() {
		 	var prj=data.project;

			var loadrevision = function() {
				var view=prj.view;
				var revid=view.revision;
				var rev=prj.revisions[revid];
				data.projectname=rev.name;
				removeallpanes();
				for (var idx in view.panes) {
					var p=view.panes[idx];
					var pane=addpane();
					pane.mode=p.mode;
					pane.file=pane.files[p.fileid];
				}
			};
			if (prj==null) {
				removeallpanes();
				data.projectname=null;
			} else {
				prj.view.bind(function(k,v) {
					if (k=="revision") loadrevision(); 
				});
				loadrevision();
			}
		};


		data.bind(function(k,v) {
			if (k=="project") loadproject();
		});

		data.panes.bind("add",function(k,v) {
			if (k instanceof Array) return;
			v.actions.add("closepane",function() {data.panes.remove(k);});
		});

		var project=demoproject(function() {
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
				project: projectui,
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
