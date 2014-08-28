var project=function() {
	var data=Maggi({
		revisions: {
			0: {
				revision:0,
				name:"Empty Project",
				started:new Date(),
				completed:null,
				committer:null,
				message:null,
				tags:null,
				parentrevision:null,
				files:[]
			}
		},
		freefileid: 0,
		view: {
			revision:0,
			panes:{}
		},
		user: {
			name:null,
			email:null
		},
		addfile: function(file) {
		        var fileid=data.freefileid++;
			var revid=data.view.revision;
			data.revisions[revid].files.add(fileid,file);
			return fileid;
		},
		branch: function(fromid) {
			if (fromid==null) fromid=data.view.revision;
			var fromrev=data.revisions[fromid];
			var newid=Object.keys(data.revisions).length;
			var newrev={
				revision:newid,
				name:fromrev.name,
				started:new Date((new Date())-1000*1000*1000),
				completed:null,
				committer:null,
				tags:null,
				message:null,
				parentrevision:fromid,
				files:JSON.parse(JSON.stringify(fromrev.files)),
				commit:function() { data.commit(newid); },
				branch:function() { data.branch(newid); }
			};
			data.revisions.add(newid,newrev);
			return newid;
		},
		commit: function(id) {
			if (id==null) id=data.view.revision;
			var rev=data.revisions[id];
			if (rev.completed) { alert("Error: Revision "+id+" already committed earlier."); return; }
			rev.completed=new Date();
			rev.committer=data.user;
		},
		commitnbranch:function() {
			data.commit();
			var newid=data.branch();
			data.view.revision=newid;
			return newid;
		}
	});
/*	data.view.bind(function(k,v) {
		if (k=="revision") data.currentrevision=data.revisions[v]);
	});*/
	return data;
};

var demoproject=function(complete) {
	var data=project();
	var rev=0;
	data.user.name="Thilo Maurer";
	data.user.email="username@domain";
	data.revisions[rev].name="Password Calculator";
	rev=data.commitnbranch();

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
	var files=data.revisions[rev].files;
	$.each(sources, function(idx,k) {
		var parts=k.split(".");
		var type="text";
		if (parts.length>0) type=parts[parts.length-1];
		$.get( k, null, function(rawdata) {
			var file={name:k,type:type,data:rawdata,cursor:{row:0,column:0}};
			data.addfile(file);
		},"text");
	});
	files.bind("add",function(k,v) {
		if (Object.keys(files).length==sources.length) filesloaded();
	});

	var filesloaded = function() {
		data.commitnbranch();
		data.view.panes.add(0,{fileid:4,mode:"edit"});
		data.view.panes.add(1,{fileid:6,mode:"preview"});
		complete(data);
	}
};


var projectui=function() {
	return {
		type:"object",
		children:{
			view: {type:"object",children:{revision:{type:"text"}}},
			revisions:{
				type:"list",
				popup:true,
				popuptrigger:"view",
				childdefault:{
					type:"user",
					user:function(dom,data,setdata,ui) {
						if (data==null) return;
						var text=data.revision;
						if (data.committer) text+=", " + data.committer.name;
						if (data.completed) text+=", " + moment(data.completed).calendar();
						dom.text(text);
					},
				},
				select:"single",
				selected:null
			},
			commitnbranch: {type:"function",label:"commit revision"},
		},
		class:"project",
		builder:function(dom,data,ui) {
			revsethandler=function(k,v) {
				if (k=="selected") { ui.children.revisions.visible=false; data.view.revision=v; }
			};		
			ui.children.revisions.bind(revsethandler);
			var d=Maggi({settings:"☰",revision:null});
			if (data) {
				data.view.bind(function(k,v) {
					if (k=="revision") d.revision=data.revisions[v];
				});
				d.revision=data.revisions[data.view.revision];
			}
			dom2=$('<div>').appendTo(dom);
			
			var ui2={type:"object",
				children:{
					settings:{type:"text"},
					revision:revisionui()
				}
			};
			ui2.children.revision.popup=true;
			ui2.children.revision.popuptrigger="settings";
			var backbuild=Maggi.UI(dom2,d,ui2);
			return function() {
				backbuild();
				ui.children.revisions.unbind(revsethandler);
			}
		}
	};
};

var projectui_info=function() {
	return {
		type:"object",
		children:{
			name: {type:"text"},
			view: {type:"object",children:{revision:{type:"text"}}},
		},
		class:"project_info",
		builder:function(dom,data,ui) {
			var rev=data.view.revision;
			var d=data.revisions[rev];
			Maggi.UI(dom,d,{
				type:"object",
				children:{
					name:{type:"text"},
					started: {type:"user",user:function(dom,data,setdata,ui) {
						if (data==null) return;
						dom.text(moment(data).calendar());
					}
				}
			}});
			
		}
	};
};

var revisionui=function() {
	return {
		type:"object",
		children:{
			name: {type:"input", placeholder:"project name"},
			revision: {type:"format",format:"Revision %d"},
			committer: {type:"user",user:function(dom,data,setdata,ui) {
				if (data==null) return;
				var text=" by "+data.name;
				if (data.email) text+=" <"+data.email+">";
				dom.text(text);
			}},
			started: {type:"user",user:function(dom,data,setdata,ui) {
				if (data==null) return;
				dom.text(moment(data).calendar());
			}},
			completed: {type:"user",user:function(dom,data,setdata,ui) {
				if (data==null) return;
				dom.text(" – "+moment(data).calendar());
			}},
			tags: {type:"input", placeholder:"tags"},
			message: {type:"input", placeholder:"commit message"},
			/*files: {type:"list",
				childdefault:{
					type:"object",
					children:{name:{type:"text"}},
				}
			}*/
			commit: {type:"function", label:"commit this revision"},
			branch: {type:"function", label:"branch from here"},
		},
		order:["name","revision","committer","started","completed","tags","message","commit","branch"],
		class:"revision",
		builder:function(dom,data,ui) {
			if (data==null) return;
			var datahandler=function(k,v) {
				if (k=="completed") { ui.children.commit.visible=(v==null); ui.children.branch.visible=(v!=null)&&true; }
			};
			data.bind(datahandler);
			datahandler("completed",data.completed);
			return function() {
				data.unbind(datahandler);
			}
		}
	};
};



