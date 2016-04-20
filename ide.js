var ideui = function() {
	return {
		children: {
            header:{
                data:{
                    title:"Maggi.UI.IDE Projects",
                    newproject:{icon:"icons/plus.svg",name:"Create new Project..."}
                },
                children:{
					newproject:{
					    children:{icon:"image", name:"text"},
					    class:"visibilityanimate prjjson hoverhighlight"
					},
                   title:{type:"text",class:"visibilityanimate"}
                },
                class:"cols"
            },
			projects: {
				class:"flexrows flexanimate",
				childdefault:prjui,
				selected:null,
				builder:function(dom,data,ui) {
					var u=function() {
					    if (ui.selected==null) dom.addClass("noneselected"); else dom.removeClass("noneselected");
						$.each(dom.ui,function(k,v) {
							var dui=dom.ui[k];
							if (ui.selected==k) {
								dui.removeClass("unselected");
							} else {
								dui.addClass("unselected");
								var dc=function(event) {
									ui.selected=k;
									dui.off("click",dc);
									event.stopPropagation();
								};
								dui.on("click",dc);
							}
						});
					};
					ui.bind("set","selected",u);
					var install=function(k) {
						if (k instanceof Array) return;
						ui.children[k].connector={
							type:"label",
							label:"<",
							onClick:function() { ui.selected=null; },
							class:"visibilityanimate hoverhighlight"
						};
                        ui.children[k].actions={
                            data:{},
                            children: {
                                deleteproject:{
                                    type:"label",
                                    label:"delete project",
                                    class:"button red",
                                    onClick:function() {
                                        if (confirm("Really delete this project?")) {
                                            ui.selected=null;
                                            data.remove(k);
                                        }
                                    }
                                },
                            }
                        };						
						u();
					};
					ui.children.bind("add",install);
					$.each(ui.children,install);
				}
			},
			filler:{type:"label",label:""},
			connecting:{
				visible:true,
				builder(dom,d,u) {
					var data=Maggi({label:"Connecting..."});
					var ui={type:"overlay",ui:{
						type:"object",
						children:{
							label:"text"
						}
					}};
					var ui={
						type:"object",
						visible:u.visible,
						children:{
							label:"text"
						}
					};
					u.bind("set","visible",function(k,v) { ui.visible=v; });
					return Maggi.UI(dom,data,ui);
				}
			}
		},
		class:"ide rows flexanimate mui-light",
		builder:function(dom,data,ui) {
			ui.children.header.children.newproject.add("onClick",function() {
				sampleprojects.Maggi(function(project) {
					var id;
					do 
						id=Math.random().toString(36).substr(2, 10);
					while (data[id]!=null);
					data.projects.add(id,project);
				});
			});
			ui.children.projects.bind("set","selected",function(k,v) {
				if (v!=null) {
					dom.addClass("prjselected");
				} else {
					dom.removeClass("prjselected");
				}
			});
		}
	};
};

var ide = function(m,dom) {
	ide_init(m);
	sampleprojects.pwcalc(function(project) {
		m.data.projects.add("0",project);
	});
	sampleprojects.Maggi(function(project) {
		m.data.projects.add("1",project);
	});
};

var ide_init = function(m,dom) {
	m.data={projects:{}};
	m.data.bind("set","projects",function(k,v) {
		for (i in v) {
			p=v[i];
			pp=projectdata(p);
			v[i]=pp;
		}
	});	
	m.ui=ideui();
};

var orderRemove=function(o,k) {
	var order=toArray(o);
	order.splice(order.indexOf(k),1);
	return order;
};

var orderInsert=function(o,k,i) {
	var order=toArray(o);
	order.splice(order.indexOf(k)+1,0,i);
	return order;
};

var toArray = function(o) {
	if (o==null) return [];
	return Object.keys(o).sort().map(function(k) { return o[k]; });
};
