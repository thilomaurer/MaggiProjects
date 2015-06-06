var prj = function(dom,prjdata,setdata,oui,datachange) {

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
		project: prjdata,
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

	datachange(loadproject);
	loadproject();

	data.panes.bind("add",function(k,v) {
		if (k instanceof Array) return;
		v.actions.add("closepane",function() {data.panes.remove(k);});
	});

	var ui = function() {
		return {
			type:"object",
			children:{
				projectname: {type: "text"},
				project: projectui,
				addpane: {type:"function",label:"Add Pane",class:"button blue"},
				panes: { 
					wrap:true,
					wrapchildren:true,
					type:"object",
					childdefault: paneui,
					class:"tablecolumns"
				},
			},
			class:"ide mui-light tablerows"
		};
	};
	ui=ui();

	return Maggi.UI(dom,data,ui);
}

var ide = function(dom,data,setdata,oui,datachange) {

	if (data==null) data=Maggi({projects: {}});

	var ui = {
		children: {
			projects: {
				type:"list",
				childdefault:{type:"user",user:prj},
				select:"single",
				selected:null,
			}
		},
		class:"ide mui-light"
	};
	Maggi.UI(dom,data,ui);
	return {data:data,ui:ui};
}
