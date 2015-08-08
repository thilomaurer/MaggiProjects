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
		},
		options:{colorscheme:true}
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
			optionsicon:{type:"label",class:"options icon"},
			options: {
				popup:true, popuptrigger:"optionsicon",
				children: {
					colorscheme:{type:"checkbox",label:"Light Color Scheme",class:""},
				},
				builder:function(dom,data,ui) {
					var bindings=[[data,"set","colorscheme",function(k,v) {
						var cls={"false":"mui-light","true":"mui"};
						$('body').removeClass(cls[v]);
						$('body').addClass(cls[!v]);
					}]];
					return installBindings(bindings);
				}
			},
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
			commitnbranch: {type:"function",label:"commit revision",class:"button"},
			run: {type:"label",label:"Run",class:"button"}
		},
		class:"project",
		builder:function(dom,data,ui) {
			var name={type:"label",builder:function(dom) { 
				var rev=data.view.revision;
				dom.text(data.revisions[rev].name);
			}};
			ui.children.add("name",name);
			ui.add("order",["optionsicon","options","name","view","revisions","commitnbranch","run"]);
			
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
	var mime={js:"text/javascript",html:"text/html",css:"text/css",txt:"text"};
	$.each(sources, function(idx,k) {
		var fn=k;
		if (k instanceof Array) {fn=k[0]; k=k[1];}
		var parts=k.split(".");
		var type="txt";
		if (parts.length>0) type=parts[parts.length-1];
		var fileid=data.addfile({name:fn,type:mime[type]});
		$.get( k, null, function(rawdata) {
			files[fileid].data=rawdata;
			nfloaded++;
			if (nfloaded==sources.length) filesloaded();
		},"text");
	});

	var filesloaded = function() {
		data.commitnbranch();
		complete(data);
	}
	if (sources.length==0) {
		data.addfile({name:"main.js",type:mime["js"]});
		data.commitnbranch();
		complete(data);
	}
};

