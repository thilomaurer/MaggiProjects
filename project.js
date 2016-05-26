var revision=function() {
	var data=Maggi({
		revision:0,
		started:new Date(),
		completed:null,
		committer:null,
		committed:false,
		parentrevision:null,
		message:null,
		files:[]
	});
	return data;
};

var projectdata=function(o) {
	var data=Maggi({
		revisions:{
			0:revision()
		},
		freefileid: 0,
		view:{
			revision:0,
			panes:{
				order:{}
			}
		},
		addfile: function(file) {
			file=filedata(file);
			var fileid=data.freefileid++;
			var revid=data.view.revision;
			data.revisions[revid].files.add(fileid,file);
			return fileid;
		},
		options:{
			colorscheme:"auto",
			user: {
				username:null,
				name:null,
				email:null,
			},
			editor: {
				gutter:{
					showGutter:true,
					fixedWidthGutter:true,
					highlightGutterLine:true,
					showLineNumbers:true,
				},
				ui: {
					animatedScroll:false,
					hScrollBarAlwaysVisible:false,
					vScrollBarAlwaysVisible:false,
					showPrintMargin:false,
					printMarginColumn:80,
					fadeFoldWidgets:false,
					showFoldWidgets:true,
					scrollPastEnd: true,
					highlightActiveLine: true,
					highlightSelectedWord: true,
				},
				editing:{
					showInvisibles:false,
					displayIndentGuides:true,
					useSoftTabs:false,
					tabSize:4,
					cursorStyle:"ace",
					selectionStyle:"line",
					keyboard:"gui"
				}
			}
		}
	});
	if (o) Maggi.merge(data,o);
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
		},
        branch: function(rev) {
            return function() {	        
                if (rev==null) return;
                var newid=Object.keys(data.revisions).length;
                var newrev=revision();
                newrev.revision=newid;
                newrev.parentrevision=rev.revision;
                newrev.files=JSON.parse(JSON.stringify(rev.files));
                data.revisions.add(newid,newrev);
                data.view.revision=newid;
                return newid;
            };
        },
        commit: function(rev) {
            return function() {
                if (rev==null) return;
                if (rev.committed) { alert("Error: Revision "+id+" already committed earlier."); return; }
                rev.completed=new Date();
                rev.committer=data.options.user.username;
                rev.committed=true;
            };
    	}
	};
	return project;
};

var buildRevisionsView = function(dom,data,ui) {
	var int_data=Maggi({
		revisions:data,
	});
	var int_ui=Maggi({
		visible:false,
		children: {
			revisionsLabel:{type:"label",label:"REVISIONS", class:"listlabel"},
			revisions: revisionsui(),
		}
	});
	ui.bind("set","selected",function(k,v) {
		int_ui.children.revisions.selected=v;	
	});
	int_ui.children.revisions.selected=ui.selected;
	int_ui.children.revisions.bind("set","selected",function(k,v) {
		ui.visible=false;
		ui.selected=v;
	});
	return Maggi.UI(dom,int_data,int_ui);
};

var revisionui=function(prjdata) {
	return {
		class:"revision",
		order:["branch","revision","parentrevision","committer","completed","message","commit"],
		children:{
			revision:{type:"text", format:"Revision #%d"},
			parentrevision:{type:"text", format:"changes #%d"},
			committer:{type:"text", format:"Author: %s"},
			completed:{type:"text"},
			message:{type:"text"},
			branch:{type:"label", label:"branch from here",class:"button gray",visible:true,onClick:null},
			commit:{type:"label", label:"commit revision",class:"button red",enabled:false,visible:true,onClick:null}
		},
		builder:function(dom,data,ui) {
		    ui.children.branch.onClick=projectfuncs(prjdata).branch(data);
		    ui.children.commit.onClick=projectfuncs(prjdata).commit(data);
			var mess=function() {
				var commitable=(data.message!=""&&data.message!=null);
				ui.children.commit.enabled=commitable;
			};
			var comm=function() {
				ui.children.message={true:"text",false:{type:"input",placeholder:"commit-message"}}[data.committed];
				ui.children.commit.visible=!data.committed;
				ui.children.branch.visible=data.committed;
			};
			return installBindings([
				[data,"set","message",mess],
				[data,"set","committed",comm]
			]);
		}
	};
};

var revisionsui=function(prjdata) {
	return {
		type:"list",
		childdefault:function() { return revisionui(prjdata); },
		class:"simplelist selectable",
		select:"single",
		selected:"null"
	};
};

Maggi.UI.labelwrap=function(dom,data,setdata,ui,onDataChange) {

	var int_ui={class:"cols labelwrap",children:{
		label:{type:"label",label:ui.label},
		data:ui.d
	}};
	var int_data=Maggi({data:data});
	int_data.bind("set","data",function(k,v) {
		setdata(v);
	});
	Maggi.UI(dom,int_data,int_ui);
};

var projectui=function() {
	return {
		children:{
		    connector:null,
			optionsicon:{type:"label",class:"options icon visibilityanimate"},
			options: {
				popup:true,
				popuptrigger:"optionsicon",
				class:"scroll",
				children: {
					colorscheme:{
						type:"labelwrap",
						label:"Color Scheme",
						d:{type:"select",
							choices:{
								"auto":{label:"auto"},
								"light":{label:"light"},
								"dark":{label:"dark"},
							}
						}
					},
					userlabel:{type:"label",label:"USER"},
					user:{
						children:{
							name:{type:"input",class:"first",placeholder:"Full Name"},
							username:{type:"input",class:"first",placeholder:"username"},
							email:{type:"input",kind:"email",placeholder:"email"}
						}
					},
					editor:{
						children:{
							editinglabel:{type:"label",label:"EDITING"},
							editing:{class:"simplelist",children:{
								showInvisibles:{type:"checkbox",label:"Show Invisibles",class:"toggle",labelposition:"before"},
								displayIndentGuides:{type:"checkbox",label:"Display Indent Guides",class:"toggle",labelposition:"before"},
								useSoftTabs:{type:"checkbox",label:"Use Soft Tabs",class:"toggle",labelposition:"before"},
								tabSize:{
									type:"labelwrap",
									label:"Tab Size",
									d:{type:"input",placeholder:"tab size"},
								},
								selectionStyle:{
									type:"labelwrap",
									label:"Selection Style",
									d:{type:"select",
										choices:{
											text:{label:"text"},
											line:{label:"line"}
										}
									}
								},
								cursorStyle:{
									type:"labelwrap",
									label:"Cursor Style",
									d:{type:"select",
										choices:{
											ace:{label:"ace"},
											slim:{label:"slim"},
											smooth:{label:"smooth"},
											wide:{label:"wide"}
										}
									}
								},
								keyboard:{
									type:"labelwrap",
									label:"Input Style",
									d:{type:"select",
										choices:{
											gui:{label:"GUI"},
											vim:{label:"VIM"},
											emacs:{label:"Emacs"}
										}
									}
								}
							}},
							gutterlabel:{type:"label",label:"GUTTER"},
							gutter:{class:"simplelist",children:{
								showGutter:{type:"checkbox",label:"Show Gutter",class:"toggle",labelposition:"before"},
								fixedWidthGutter:{type:"checkbox",label:"Fixed Gutter Width",class:"toggle",labelposition:"before"},
								showLineNumbers:{type:"checkbox",label:"Show Line Numbers",class:"toggle",labelposition:"before"},
								highlightGutterLine:{type:"checkbox",label:"Highlight Gutter Line",class:"toggle",labelposition:"before"},
							}},
							uilabel:{type:"label",label:"USER INTERFACE"},
							ui:{class:"simplelist",children:{
								animatedScroll:{type:"checkbox",label:"Animate Scrolling",class:"toggle",labelposition:"before"},
								showPrintMargin:{type:"checkbox",label:"Show Print Margin",class:"toggle",labelposition:"before"},
								printMarginColumn:{
									type:"labelwrap",
									label:"Print Margin",
									d:{type:"input",placeholder:"column"}
								},
								showFoldWidgets:{type:"checkbox",label:"Show Fold Widgets",class:"toggle",labelposition:"before"},
								fadeFoldWidgets:{type:"checkbox",label:"Fade Fold Widgets",class:"toggle",labelposition:"before"},
								scrollPastEnd:{type:"checkbox",label:"Scroll Past End",class:"toggle",labelposition:"before"},
								hScrollBarAlwaysVisible:{type:"checkbox",label:"Persistent HScroll",class:"toggle",labelposition:"before"},
								vScrollBarAlwaysVisible:{type:"checkbox",label:"Persistent VScroll",class:"toggle",labelposition:"before"},
								highlightActiveLine:{type:"checkbox",label:"Highlight Active Line",class:"toggle",labelposition:"before"},
								highlightSelectedWord:{type:"checkbox",label:"Hightlight Selected Word",class:"toggle",labelposition:"before"},
							}}
						}
					},
				},
				builder:function(dom,data,ui) {
					if (data==null) return;
					var bindings=[[data,"set","colorscheme",function(k,v,oldv) {
						if (v=="auto") {
							var h=new Date().getHours();
							if (h>6&&h<17) v="light"; else v="dark";
						}
						var cls={"light":"mui-light","dark":"mui"};
						$('body').removeClass("mui-light");
						$('body').removeClass("mui");
						$('body').addClass(cls[v]);
					}]];
					return installBindings(bindings);
				}
			},
		    prjjson:{
				data:null,
				children:{
					icon:"image",
					name:"text"
				},
				class:"prjjson hoverhighlight"
		    },
            prjjson_actions:{
			    data:{},
				popup:true,
				popuptrigger:"prjjson",
				children: {
				    actions:null
				}
			},			
			view: {children:{revision:{type:"text"}},class:"visibilityanimate hoverhighlight"},
			revisions:{
				popup:true,
				popuptrigger:"view",
				children:{},
				selected:null,
				builder:null,
				class:"scroll"
			}
		},
		order:["connector","optionsicon","options","prjjson","prjjson_actions","view","revisions"],
		class:"project",
		builder:function(dom,data,ui) {
			if (data==null) return;
            var buildRevisionsView = function(dom,d,ui) {
            	var int_data=Maggi({
            		revisions:d,
            	});
            	var int_ui=Maggi({
            		visible:false,
            		children: {
            			revisionsLabel:{type:"label",label:"REVISIONS", class:"listlabel"},
            			revisions: revisionsui(data),
            		}
            	});
            	ui.bind("set","selected",function(k,v) {
            		int_ui.children.revisions.selected=v;	
            	});
            	int_ui.children.revisions.selected=ui.selected;
            	int_ui.children.revisions.bind("set","selected",function(k,v) {
            		ui.visible=false;
            		ui.selected=v;
            	});
            	return Maggi.UI(dom,int_data,int_ui);
            };

			ui.children.revisions.builder=buildRevisionsView;

			(function() {
			    var u=ui.children.prjjson;
				if (u.data!=null) return;
				var rev=data.view.revision;
				var k=childwithkv(data.revisions[rev].files,"name","project.json");
				var update=function() {
					var d;
					try {
						d=JSON.parse(k.data);
					} catch(e) {
						console.log(e);
					}
					if (d==null) return;
					var i=d.icon;
					if (i&&(i.startsWith("http://")||i.startsWith("https://"))) {
					} else {
						var files=data.revisions[rev].files;
						for (var fidx in files) {
							name=files[fidx].name;
							if (name==i) {
								var src="data:"+files[fidx].type+";utf8,"+files[fidx].data;
								d.icon=src;
							}
						}
					}
					u.add("data",d);
				};
				if (k!=null) {					
				    k.bind("set","data",update);
				    update();
				}
			})();
				

			var setrevision=function(k,v) { ui.children.revisions.selected=v; };
			var revsethandler=function(k,v) { data.view.revision=v; };		
			var handlers=[
			    [data.view,"set","revision",setrevision],
			    [ui.children.revisions,"set","selected",revsethandler]
			];
			
			return installBindings(handlers);
		}
	};
};

var projectui2=function() {
	return {
		children:{
		    prjjson:{
				data:null,
				children:{
					icon:"image",
					name:"text"
				},
				class:"prjjson hoverhighlight"
		    }
		},
		class:"project2",
		builder:function(dom,data,ui) {
			if (data==null) return;

			(function() {
			    var u=ui.children.prjjson;
				if (u.data!=null) return;
				var rev=data.view.revision;
				var k=childwithkv(data.revisions[rev].files,"name","project.json");
				var update=function() {
					var d;
					try {
						d=JSON.parse(k.data);
					} catch(e) {
						console.log(e);
					}
					if (d==null) return;
					var i=d.icon;
					if (i&&(i.startsWith("http://")||i.startsWith("https://"))) {
					} else {
						var files=data.revisions[rev].files;
						for (var fidx in files) {
							name=files[fidx].name;
							if (name==i) {
								var src="data:"+files[fidx].type+";utf8,"+files[fidx].data;
								d.icon=src;
							}
						}
					}
					u.add("data",d);
				};
				if (k!=null) {					
				    k.bind("set","data",update);
				    update();
				}
			})();
		}
	};
};


var childwithkv = function(o,key,name) {
	for (var k in o) 
		if (name==o[k][key]) return o[k];
	return null;
};

var initproject=function(user,metadata,sources,complete) {

	var mime={
		js:"application/javascript",
		html:"text/html",
		css:"text/css",
		txt:"text/plain",
		json:"application/json",
		svg:"image/svg+xml"
	};

	var data=projectdata();
	var rev=0;
	data.options.user=user;

	data.addfile({name:"project.json",type:mime["json"],data:JSON.stringify(metadata,null,"\t")});

	var files=data.revisions[rev].files;
	data.revisions[rev].message="start of project";
	var nfloaded=0;
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
	    var r=data.revisions[rev];
	    projectfuncs(data).commit(r)();
//		data.revisions[rev].commit();
		complete(data);
	};
	if (sources.length==0) {
		data.addfile({name:"main.js",type:mime["js"]});
		filesloaded();
	}
};

var project=function(m,dom) {
	sampleprojects.pwcalc(function(project) {
		m.data=project;
		m.ui=projectui;
		dom.addClass("expand");
	});
};
