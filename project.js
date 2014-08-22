var project=function() {
	var data=Maggi({
		revisions:{
			0:{
				revision:0,
				name:null,
				started:new Date(),
				completed:null,
				committer:null,
				parentrevision:null,
				files:[]
			}
		},
		freefileid: 0,
		view:{
			revision:0,
			panes:{/*
				1:{fileid:4,mode:"edit"},
				2:{fileid:6,mode:"preview"}*/
			}
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
				started:new Date(),
				parentrevision:fromid,
				files:JSON.parse(JSON.stringify(fromrev.files))
			};
			data.revisions.add(newid,newrev);
			data.view.revision=newid;
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
			return data.branch();
		}
	});
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
		complete();
	}

	return data;
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
					type:"object",
					children:{
						revision:{type:"text"}
					}
				},
				select:"single",
				selected:null
			},
			commitnbranch: {type:"function",label:"commit revision"},
		},
		class:"project",
		builder:function(dom,data,ui) {
			ui.children.revisions.bind(function(k,v) {
				if (k=="selected") { ui.children.revisions.visible=false; data.view.revision=v; }
			});		
		}
	};
}



