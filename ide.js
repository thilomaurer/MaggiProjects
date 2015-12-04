var ideui = function() {
	return {
		children: {
			header:{type:"label",label:"Maggi.UI.IDE Projects",wrap:true,class:"visibilityanimate"},
			projects: {
				class:"flexrows flexanimate",
				childdefault:prjui,
				selected:null,
				builder:function(dom,data,ui) {
					var u=function() {
						console.log("u");
						$.each(dom.ui,function(k,v) {
							var dui=dom.ui[k];
							if (ui.selected==k) {
								dui.removeClass("unselected");
								console.log("  select-"+k);
							} else {
								dui.addClass("unselected");
								console.log("unselect-"+k);
								var dc=function(event) {
									ui.selected=k;
									dui.off("click",dc);
									console.log("disable-click-"+k);
									event.stopPropagation();
								};
								dui.on("click",dc);
								console.log(" enable-click-"+k);
							}
						});
					}
					ui.bind("set","selected",u);
					var install=function(k) {
						if (k instanceof Array) return;
						var blc=function(event) {
							ui.selected=null;
							event.stopPropagation();
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
//	m.ui.children.projects.selected="dfd";
	sampleprojects.pwcalc(function(project) {
		m.data.projects.add("0",project);
	});
	sampleprojects.pwcalc(function(project) {
		m.data.projects.add("1",project);
	});
};

var ide_init = function(m,dom) {
	m.data={projects:{}};
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

var remap = function(o,key) {
	var r={};
	for (var k in o) {
		var name=o[k][key];
		r[name]=o[k];
	}
	return r;
}
