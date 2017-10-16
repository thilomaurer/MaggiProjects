var prj = function(m, dom) {
	var apply = function(project) {
		m.data = project;
		m.ui = prjui;
	};
	sampleprojects.Maggi(apply);
	setTimeout(function() {
		initproject_git({ name: "<nobody>", username: "username", email: "user@localhost" },
			"https://github.com/example.git",
			"master",
			function(project) {
				m.data=project;
				//m.data.commands.add(1,{command:"other"})
				setTimeout(function() {
					m.data.commands.remove(0);
				},3000);
			});
	}, 3000);
	dom.addClass("expand");
	$('html').addClass("mui");
};

var prjui = function() {
	return {
		children: {
			project: projectui,
			view: {
				children: {
					panes: null
				},
				class: "rows visibilityanimate"
			}
		},
		connector: null,
		actions: null,
		mode: null,
		class: "prj rows",
		builder: function(dom, data, ui) {
			if (ui.data != null) return;
			ui.add("data", {
				project: data,
				view: data && data.view
			});
			ui.children.view.children.panes = panesui(data);
			ui.bind("set", "connector", function(k, v) {
				ui.children.project.children.connector = ui.connector;
			});
			ui.bind("set", "actions", function(k, v) {
				ui.children.project.children.prjjson_actions.children.actions = ui.actions;
			});
			ui.bind("set", "mode", function(k, v) {
				if (v == "inactive") ui.data.view = {};
				if (v == "active") ui.data.view = data.view;
			});
		}
	};
};
