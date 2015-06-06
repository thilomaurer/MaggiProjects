var ide = function(dom,odata,setdata,oui,datachange) {

	var data = function() {

		var addpane=function() {
			var n=Object.keys(data.panes).length;
			var pane=panedata();
			var rev=data.project.view.revision;
			pane.files=data.project.revisions[rev].files;
			pane.key=n;
			pane.bind("add","removenow",function(k,v) {
				data.panes.remove(pane.key);
			});
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
		if (odata!=null) data.projects=odata;

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


		data.bind("set",function(k,v) {
			if (k=="project") loadproject();
		});

		data.panes.bind("add",function(k,v) {
			if (k instanceof Array) return;
			v.actions.add("closepane",function() {data.panes.remove(k);});
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
				projects: {
					type:"list",
					popup:true,
					popuptrigger:"projectname",
					childdefault:projectui_info,
					select:"single",
					selected:null,
					builder:function(dom,data,ui) {
						ui.bind("set",function(k,v) {
							if (k=="selected") {
								d.project=d.projects[v];
								ui.visible=false;
							}
						});
					}
				},
				addpane: {type:"function",label:"Add Pane",class:"button blue"},
				panes: { 
					wrap:true,
					wrapchildren:true,
					type:"object",
					childdefault: paneui,
					class:"tablecolumns"
				},
			},
			order:null,
			class:"ide mui-light tablerows"
		};
	};
	ui=ui();

	if (oui) oui.bind("set","projectid",function(k,v) {
		d.project=d.projects[v];
	});
	if (oui) oui.bind("set","panesonly",function(k,v) {
		if (v) 
			ui.order=["panes"];
	});
	if (oui) if (oui.panesonly) 
		ui.order=["panes"];

	Maggi.UI(dom,d,ui);
	return d;
}
