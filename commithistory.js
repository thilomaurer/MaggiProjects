var commithistory = function(m, dom) {
	m.data = commithistory.exampledata();
	m.ui = commithistory.ui;
	$('html').addClass("mui");
	commithistory.revive(m.data);
};

commithistory.data = function(o) {
	var data = Maggi({});
	if (o) Maggi.merge(data, o);
	return data;
};

commithistory.exampledata = function() {
	var now = new Date().getTime() + 1000;
	return commithistory.data({
		0: commit.data({ date: null, committed: false, author: { name: "Example User", email: "user@example.com" } }),
		1: commit.data({ date: now, committed: true, message: "last change" }),
		2: commit.data({ date: now - 1000 * 60, committed: true, message: "some changes", author: "Alice", id: "7df7sd9f0d7s6a8s9d90f0d9s0" }),
		3: commit.data({ date: now - 1000 * 60 * 60, committed: true, message: "initial commit", author: "Bob", id: "f8d8s7f9dd78s6a0a6d4asf1a" }),
		4: commit.data({ date: now - 1000 * 60 * 60 * 24, committed: true, message: "initial commit", author: "Bob", id: "f8d8s7f9dd78s6a0a6d4asf1a" }),
		5: commit.data({ date: now - 1000 * 60 * 60 * 24 * 7, committed: true, message: "initial commit", author: "Bob", id: "f8d8s7f9dd78s6a0a6d4asf1a" })
	});
};

Maggi.revive = function(o, funcs) {
	for (var k in o) {
		var f = funcs[k] || funcs[""] || null;
		if (f)
			f(o[k]);
	}
};

commithistory.revive = function(data) {
	console.log("commithistory.revive");
	Maggi.revive(data, {
		"": commit.revive
	});
};


commithistory.ui = function(prjdata) {
	return {
		type: "list",
		childdefault: function() {
			var ui=commit.ui(prjdata);
			return ui;
			
		},
		class: "simplelist selectable",
		select: "none",
		selected: "null"
	};
};
