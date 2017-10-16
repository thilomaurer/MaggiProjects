var stash = function(m, dom) {
	m.data = commit.data({
		index: "1",
		message: "a first stash and some lengthy text",
		id: "343209sdf"
	});
	m.ui = stash.ui;
	$('html').addClass("mui");
};

stash.data = function(o) {
	var data = Maggi({
		index: null,
		message: null,
		id: null,
	});
	if (o) Maggi.merge(data, o);
	stash.revive(data);
	return data;
};

stash.revive = function(data) {
	console.log("stash.revive");
	/*
	data.drop = function() {};
	data.apply = function() {};
	*/
};

stash.ui = function(prjdata) {
	return {
		class: "stash",
		children: {
			index: "text",
			message: "text",
			id: "text",
			drop: { type: "function", label: "drop", class: "button red", enabled: true, visible: true, onClick: null },
			apply: { type: "function", label: "apply", class: "button gray", enabled: true, visible: true, onClick: null }
		},
		order: ["drop", "apply", "index", "message", "id"],
		builder: function(dom, data, ui) {
			var dr = function() {
				if (window.confirm("Really drop this stash "+data.index+" ?"))
					prjdata.drop_stash(data.index);
			};
			ui.children.drop.onClick = dr;
			var ap = function() {
				prjdata.apply_stash(data.index);
			};
			ui.children.apply.onClick = ap;
		}
	};
}
