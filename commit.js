var commit = function(m, dom) {
	m.data = commit.data({
		message: "fix many things not telling what specifically",
		author: "Thilo Maurer",
		date: new Date().getTime()
	});
	m.ui = commit.ui;
	$('html').addClass("mui");
}

commit.data = function(o) {
	var data = Maggi({
		id: null,
		date: null,
		committed: false,
		parent_ids: {},
		message: null,
		author: null,
	});
	if (o) Maggi.merge(data, o);
	data.branch = function() {};
	data.commit = function() {
		data.date=new Date().getTime();
		data.committed=true;
	};
	return data;
};



commit.ui = function(prjdata) {
	var dateformat = function(dom, data, setdata, ui, datachange) {
		var up = function(data) {
			if (data) dom.text(" on " + new Date(data).toString());
			else dom.text("");
		};
		datachange(up);
		up(data);
	};
	var committedformat = function(dom, data, setdata, ui, datachange) {
		var up = function(data) {
			if (data) dom.text(" committed ");
			else dom.text(" working ");
		};
		datachange(up);
		up(data);
	};
	var idformat = function(dom, data, setdata, ui, datachange) {
		var up = function(data) {
			if (data) dom.text(data.substring(0,8));
			else dom.text(" working ");
		};
		datachange(up);
		up(data);
	};	
	return {
		class: "commit",
		order: ["branch", "message", "author", "committed","id", "date", "commit"],
		children: {
			id: { type: "user", user: idformat },
			message: { type: "text" },
			author: { type: "text" },
			committed: { type: "user", user: committedformat },
			date: { type: "user", user: dateformat },
			branch: { type: "label", label: "branch from here", class: "button gray", visible: true, onClick: null },
			commit: { type: "function", label: "commit revision", class: "button red", enabled: false, visible: true, onClick: null }
		},
		builder: function(dom, data, ui) {
			ui.children.branch.onClick = projectfuncs(prjdata).branch(data);
			//ui.children.commit.onClick = projectfuncs(prjdata).commit(data);
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
