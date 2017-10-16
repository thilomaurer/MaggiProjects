var ideheader = function() {
	return {
		wrap: true,
		data: {
			banner: {
				logo: "node_modules/Maggi.js/Maggi.js.svg",
				title: "aggi Projects",
			},
			newproject: { icon: "", name: "Create new Project..." }
		},
		children: {
			banner: {
				wrap: true,
				children: {
					logo: { type: "image", class: "logo" },
					title: { type: "text" }
				},
				class: "visibilityanimate"
			},
			newproject: {
				children: { icon: { class: "ion-md-add ion-lg" }, name: "text" },
				class: "visibilityanimate prjjson hoverhighlight"
			}
		},
		class: "ideheader",
		//class: "cols",
		visible: true
	};
};

var ideui = function() {
	return {
		children: {
			header: ideheader,
			projects: {
				class: "flexrows flexanimate",
				childdefault: prjui,
				selected: null,
				builder: function(dom, data, ui) {
					var u = function() {
						if (ui.selected == null) dom.addClass("noneselected");
						else dom.removeClass("noneselected");
						$.each(dom.ui, function(k, v) {
							var dui = dom.ui[k];
							ui.children[k].mode = { true: "active", false: "inactive" }[ui.selected == k];
							dom.ui[k][{ true: "removeClass", false: "addClass" }[ui.selected == k]]("unselected");
							if (ui.selected != k) {
								var dui = dom.ui[k];
								var dc = function(event) {
									ui.selected = k;
									dui.off("click", dc);
									event.stopPropagation();
								};
								dui.on("click", dc);
							}
						});
					};
					var install = function(k) {
						if (k instanceof Array) return;
						ui.children[k].connector = {
							onClick: function() { ui.selected = null; },
							class: "visibilityanimate hoverhighlight ion-ios-arrow-forward ion-flip-x"
						};
						ui.children[k].actions = {
							data: {},
							children: {
								deleteproject: {
									type: "label",
									label: "delete project",
									class: "button red",
									onClick: function() {
										if (confirm("Really delete this project?")) {
											ui.selected = null;
											data.remove(k);
										}
									}
								},
							}
						};
						u();
					};
					ui.bind("set", "selected", u);
					ui.children.bind("add", install);
					$.each(ui.children, install);
					return function() {
						ui.unbind("set", u);
						ui.children.unbind("add", install);
					};
				}
			},
			filler: { type: "label", label: "" },
			connecting: {
				visible: true,
				builder(dom, d, u) {
					var data = Maggi({ label: "Connecting..." });
					var ui = {
						type: "overlay",
						ui: {
							type: "object",
							children: {
								label: "text"
							}
						}
					};
					var ui = {
						type: "object",
						visible: u.visible,
						children: {
							label: "text"
						}
					};
					u.bind("set", "visible", function(k, v) { ui.visible = v; });
					return Maggi.UI(dom, data, ui);
				}
			}
		},
		offline: false,
		showheader: true,
		class: "ide rows flexanimate",
		builder: function(dom, data, ui) {
			if (!($('html').hasClass("mui")||$('html').hasClass("mui-light")))
				$('html').addClass("mui-light");
			ui.bind("set", "offline", function(k, v) {
				ui.children.connecting.visible = !v;
			});
			ui.bind("set", "showheader", function(k, v) {
				ui.children.header.visible = v;
			});
			var gen_unused_id = function() {
				var id;
				do
					id = Math.random().toString(36).substr(2, 10);
				while (data[id] != null);
				return id;
			};
			var add_project = function(project) {
				var id = gen_unused_id();
				project.id = id;
				data.projects.add(id, project);
			};
			ui.children.header.children.newproject.add("onClick", function(e) {
				makeProjectCreator($('body'), function(prj) {
					prj(add_project);
				});
			});
			ui.children.projects.bind("set", "selected", function(k, v) {
				if (v != null) {
					dom.addClass("prjselected");
				} else {
					dom.removeClass("prjselected");
				}
			});
		}
	};
};

var ide_init = function(m, dom) {
	
	m.data = { projects: {} };
	m.bind("set","data",function(k,v) {
		if (k instanceof Array) return;
		ide.revive(v);
	});
	m.ui = ideui();
};

var orderRemove = function(o, k) {
	var order = toArray(o);
	order.splice(order.indexOf(k), 1);
	return order;
};

var orderInsert = function(o, k, i) {
	var order = toArray(o);
	order.splice(order.indexOf(k) + 1, 0, i);
	return order;
};

var toArray = function(o) {
	if (o == null) return [];
	return Object.keys(o).sort().map(function(k) { return o[k]; });
};

var ide = function(m) {
	ide_init(m);
	m.ui.children.connecting.visible = false;
};

ide.revive = function(data) {
	console.log("ide.revive");
	Maggi.revive(data, {
		"projects": projects.revive
	});
	data.bind("add","projects",function(k,v) {
		projects.revive(v);	
	});
};

var projects = {};
projects.revive = function(data) {
	console.log("projects.revive");
	Maggi.revive(data, {
		"": project.revive
	});
	data.bind("add", function(k,v) {
		if (k instanceof Array) return;
		project.revive(v);	
	});
};
