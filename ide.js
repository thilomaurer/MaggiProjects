var ideui = function() {
	return {
		children: {
			header:{type:"label",label:"Maggi.UI.IDE Projects",wrap:true,class:"visibilityanimate"},
			projects: {
				class:"flexrows flexanimate",
				childdefault:prjui,
				selected:null,
				children:{
					newproject:{
						type:"label",
						label:"Create new Project...",
						class:"prj",
					}
				},
				builder:function(dom,data,ui) {
					var u=function() {
					    if (ui.selected==null) dom.addClass("noneselected"); else dom.removeClass("noneselected");
						$.each(dom.ui,function(k,v) {
							var dui=dom.ui[k];
							if (k=="newproject") { dui.addClass("unselected"); return;}
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
						if (k=="newproject") return;
						var blc=function() {
							ui.selected=null;
						};
						var connector={
							type:"label",
							label:"<",
							onClick:blc,
							class:"visibilityanimate"
						};
						ui.children[k].connector=connector;
						u();
					};
					ui.children.bind("add",install);
					$.each(ui.children,install);
					ui.children.newproject.add("onClick",function() {
						sampleprojects.Maggi(function(project) {
							var id;
							do 
								id=Math.random().toString(36).substr(2, 10);
							while (data[id]!=null);
							data.add(id,project);
						});
					});
				}
			},
			filler:{type:"label",label:""}
		},
		class:"ide rows flexanimate mui-light",
		builder:function(dom,data,ui) {
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
	m.ui=ideui;
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
