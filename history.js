var history = function(m, dom) {
	m.data = history.data({
		message: "fix many things not telling what specifically",
		author: "Thilo Maurer",
		date: new Date().getTime()
	});
	m.ui = history.ui;
	$('html').addClass("mui");
};

history.data = function(o) {
	var data = Maggi({
		id: null,
		date: null,
		committed: false,
		parent_ids: {},
		message: null,
		author: null,
	});
	if (o) Maggi.merge(data, o);
	return data;
};


history.ui = function(prjdata) {
	return {
		type: "list",
		childdefault: function() { return revision.ui(prjdata); },
		class: "simplelist selectable",
		select: "single",
		selected: "null"
	};
};
