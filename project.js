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
			panes:{
				order:{}
			}
		},
		user: {
			name:null,
			email:null
		},
		addfile: function(file) {
			file=filedata(file);
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
				completed:null,
				committer:null,
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

var projectfuncs=function(data) {
	var project={
		addfile: function(file) {
			file=filedata(file);
			var fileid=data.freefileid++;
			var revid=data.view.revision;
			data.revisions[revid].files.add(fileid,file);
			return fileid;
		}
	};
	return project;
};


var projectui=function() {
	return {
		children:{
			view: {children:{revision:{type:"text"}}},
			revisions:{
				type:"list",
				popup:true,
				popuptrigger:"view",
				childdefault:{
					children:{
						revision:{type:"text"}
					}
				},
				select:"single",
				selected:null
			},
			commitnbranch: {type:"function",label:"commit revision",class:"button"}
		},
		class:"project",
		builder:function(dom,data,ui) {
			var name={type:"label",builder:function(dom) { 
				var rev=data.view.revision;
				dom.text(data.revisions[rev].name);
			}};
			ui.children.add("name",name);
			ui.add("order",["name","view","revisions","commitnbranch"]);
			
			revsethandler=function(k,v) {
				if (k=="selected") { ui.children.revisions.visible=false; data.view.revision=v; }
			};		
			ui.children.revisions.bind(revsethandler);
			return function() {
				ui.children.revisions.unbind(revsethandler);
			}
		}
	};
}

var projectui_info=function() {
	return {
		children:{
			//name: {type:"text"},
			//view: {children:{revision:{type:"text"}}},
		},
		class:"project_info",
		builder:function(dom,data,ui) {
			var rev=data.view.revision;
			var name=data.revisions[rev].name;
			var d=Maggi({name:name,date:new Date()});
			Maggi.UI(dom,d,{children:{name:{type:"text"}/*,date:{type:"text"}*/}});
		}
	};
}



var initproject=function(username,email,name,sources,complete) {
	var data=project();
	var rev=0;
	data.user.name=username;
	data.user.email=email;
	data.revisions[rev].name=name;
	rev=data.commitnbranch();

	var files=data.revisions[rev].files;
	var nfloaded=0;
	$.each(sources, function(idx,k) {
		var parts=k.split(".");
		var type="text";
		if (parts.length>0) type=parts[parts.length-1];
		var fileid=data.addfile({name:k,type:type});
		$.get( k, null, function(rawdata) {
			files[fileid].data=rawdata;
			nfloaded++;
			if (nfloaded==sources.length) filesloaded();
		},"text");
	});

	var filesloaded = function() {
		data.commitnbranch();
		data.view.panes.add(0,{fileid:0,mode:"edit"});
		data.view.panes.add(1,{fileid:1,mode:"edit"});
		data.view.panes.add(2,{fileid:0,mode:"preview"});
		data.view.panes.order=["0","1","2"];
		complete(data);
	}
};

