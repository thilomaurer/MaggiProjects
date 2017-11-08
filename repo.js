var repo = function(m, dom) {
	m.data = repo.exampledata();
	m.ui = repo.ui;
	$('html').addClass("mui");
	repo.revive(m.data);
};

repo.data = function(o) {
	var data = Maggi({
		refs: {
			branches: {},
			tags: {},
			notes: {},
		},
		stashes: {},
		history: commithistory.data(),

	});
	if (o) Maggi.merge(data, o);
	return data;
};

repo.exampledata = function() {
	return repo.data({
		refs: {
			branches: ["master", "devel", "other"],
			tags: ["r0.1", "r0.2", "r1.0", "r2.0", "dfsdfjsdhfjsdhfjksdhfkjsdhfksd", "fsjsdhfjsdfhskdh", "!fsdhfsdj"]
		},
		stashes: {
			0: { index: "1", message: "a first stash fsd fs fs df sdf sd f sd f sd fs df sd f sd fsdf f sd fs df sd fs df sd f sdf sd f sd f ds f", id: "343209sdf" }
		},
		history: commithistory.exampledata()
	});
};

repo.revive = function(data) {
	console.log("repo.revive");
	Maggi.revive(data, {
		history: commithistory.revive
	});
	var historychanged = function(k, ch) {
		if (typeof k === "string") {
			commithistory.revive(ch);
		}
	};
	data.bind("add", "history", historychanged);
	data.bind("set", "history", historychanged);
};


repo.ui = function(prjdata) {
	return {
		class: "repo",
		children: {
			push: { type: "function", label: "push to GIT server", class: "button red", enabled: true, visible: true, onClick: null },
			pull: { type: "function", label: "pull from GIT server", class: "button gray", enabled: true, visible: true, onClick: null },
			refs: {
				children: {
					branchLabel: { type: "label", label: "BRANCHES", class: "listlabel" },
					branches: { childdefault: "text" },
					tagsLabel: { type: "label", label: "TAGS", class: "listlabel" },
					tags: { childdefault: "text" },
					notesLabel: { type: "label", label: "NOTES", class: "listlabel" },
					notes: { childdefault: "text" },
				}
			},
			stashLabel: { type: "label", label: "STASHES", class: "listlabel" },
			stashes: function() {
				return {
					type: "list",
					class: "simplelist",
					childdefault: stash.ui(prjdata)
				};
			},
			historyLabel: { type: "label", label: "HISTORY", class: "listlabel" },
			history: commithistory.ui(prjdata),
		},
		builder: function(dom, data, ui) {
			var push = function() {
				if (window.confirm("Really push to GIT server?\nCannot be undone.")) {
					prjdata.push();
					ui.visible = false;
				}
			};
			ui.children.push.onClick = push;
			var pull = function() {
				if (window.confirm("Really pull from GIT server?\nGUI will break on merge conflict.")) {
					prjdata.pull();
					ui.visible = false;
				}
			};
			ui.children.pull.onClick = pull;
		}
	};
};

repo.popupui = function(prjdata) {
	var ui = repo.ui(prjdata);
	var o = {
		popup: true,
		popuptrigger: "checkedout",
		selected: null,
		//class: "scroll"
	};
	ui.class += " scroll";
	Object.assign(ui, o);
	return ui;
};
