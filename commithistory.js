var commithistory = function(m, dom) {
	m.data = commithistory.data({
		0: commit.data({ committed: false, author: "Me", id: "next-commit" }),
		1: commit.data({ committed: true, message: "some changes", author: "Alice", id: "7df7sd9f0d7s6a8s9d90f0d9s0" }),
		2: commit.data({ committed: true, message: "initial commit", author: "Bob", date: new Date().getTime(), id: "f8d8s7f9dd78s6a0a6d4asf1a" })
	});
	m.ui = commithistory.ui;
	$('html').addClass("mui");
};

commithistory.data = function(o) {
	var data = Maggi({});
	if (o) Maggi.merge(data, o);
	return data;
};


commithistory.ui = function(prjdata) {
	return {
		type: "list",
		childdefault: function() { return commit.ui(prjdata); },
		class: "simplelist selectable",
		select: "single",
		selected: "null"
	};
};
