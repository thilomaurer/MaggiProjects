var revision = function(m, dom) {
	m.data = revision.data();
	m.data.id = "435345kljk";
	m.data.parent_ids = "3424";
	m.data.message = "fix many things not telling what specifically";
	m.data.committed = true;
	m.data.author = "Thilo Maurer";
	m.data.date = new Date().getTime();
	m.ui = revision.ui;
	$('html').addClass("mui");
}

revision.data = function() {
	var data = Maggi({
		revision: 0,
		started: new Date(),
		completed: null,
		committer: null,
		committed: false,
		parentrevision: null,
		message: null,
		files: []
	});
	return data;
};



revision.ui = function(prjdata) {
	var dateformat = function(dom, data, setdata, ui, datachange) {
		var up = function(data) {
			if (data) dom.text(" committed on " + new Date(data).toString());
			else dom.text("");
		};
		datachange(up);
		up(data);
	};

	return {
		class: "revision",
		order: ["branch", "message", "author", "date"],
		children: {
			message: { type: "text" },
			author: { type: "text" },
			date: { type: "user", user: dateformat },
			branch: { type: "label", label: "branch from here", class: "button gray", visible: true, onClick: null },
			commit: { type: "label", label: "commit revision", class: "button red", enabled: false, visible: true, onClick: null }
		},
		builder: function(dom, data, ui) {
			ui.children.branch.onClick = projectfuncs(prjdata).branch(data);
			ui.children.commit.onClick = projectfuncs(prjdata).commit(data);
			var mess = function() {
				var commitable = (data.message != "" && data.message != null);
				ui.children.commit.enabled = commitable;
			};
			var comm = function() {
				ui.children.message = { true: "text", false: { type: "input", placeholder: "commit-message" } }[data.committed];
				ui.children.commit.visible = !data.committed;
				ui.children.branch.visible = data.committed;
			};
			return installBindings([
				[data, "set", "message", mess],
				[data, "set", "committed", comm]
			]);
		}
	};
};

var revisionsui = function(prjdata) {
	return {
		type: "list",
		childdefault: function() { return revision.ui(prjdata); },
		class: "simplelist selectable",
		select: "single",
		selected: "null"
	};
};
