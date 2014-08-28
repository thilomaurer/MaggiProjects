var main = function() {

moment.locale('en', {
    calendar : {
        lastDay : '[Yesterday at] LT',
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        lastWeek : '[last] dddd [at] LT',
        nextWeek : 'dddd [at] LT',
        sameElse : 'llll'
    }
});

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

		var projects=Maggi({});

		var addproject=function(project) {
			var n=Object.keys(data.projects).length;
			data.projects.add(n,project);
		};

		var addnewproject=function() {
			var p=project();
			p.branch();
			addproject(p);
		};

		var data=Maggi({
			projectname: null,
			projectmenu: {
				addnewproject:addnewproject,
				projects:projects
			},
			project: null,
			projects: projects,
			addpane: addpane,
			panes: {}
		});

		var loadproject = function() {
		 	var prj=data.project;

			var loadrevision = function() {
				removeallpanes();
				var view=prj.view;
				var revid=view.revision;
				if (revid==null) {data.projectname="empty project"; return; }
				var rev=prj.revisions[revid];
				data.projectname=rev.name;
				for (var idx in view.panes) {
					var p=view.panes[idx];
					var pane=addpane();
					pane.mode=p.mode;
					pane.file=pane.files[p.fileid];
				}
			};
			if (prj==null) {
				removeallpanes();
				data.projectname="<no project>";
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

		demoproject(function(project) {
			var n=Object.keys(data.projects).length;
			data.projects.add(n,project);
		});
		loadproject();

		return data;
	};

	var d = data();
	var ui = function() {
		return {
			type:"object",
			children:{
				projectname: {type: "text"},
				project: projectui,
				projectmenu: {
					type: "object",
					popup:true,
					popuptrigger:"projectname",
					children: {
						addnewproject:{type:"function",label:"Create new project"},
						projects: {
							type:"list",
							childdefault:projectui_info,
							select:"single",
							selected:null
						}
					}
				},
				addpane: {type:"function",label:"Add Pane"},
				panes: { 
					type:"object",
					childdefault: paneui,
				}
			},
			class:"ide",
			builder: function(dom,data,ui) {
				var pm=ui.children.projectmenu;
				var ps=pm.children.projects;
				projectshandler = function(k,v) {
					if (k=="selected") {
						data.project=data.projects[v];
						pm.visible=false;
					}
				};
				ps.bind(projectshandler);
				return function() {
					ps.unbind(projectshandler);
				};
			}
		};
	};

	var dom=$('body');
	Maggi.UI(dom,d,ui);
}
