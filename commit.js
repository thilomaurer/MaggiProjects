var commit = function(m, dom) {
	m.data = commit.data({
		message: "fix many things not telling what specifically",
		author: { name: "Example User", email: "user@example.com" },
		date: new Date().getTime(), //- 1000 * 60, // * 60 * 24 * 6,
		tags: ["HEAD", "master", "r1.0"]
	});
	m.ui = commit.ui;
	$('html').addClass("mui");
};

commit.data = function(o) {
	var data = Maggi({
		id: null,
		date: null,
		committed: false,
		parent_ids: {},
		message: null,
		author: { name: null, email: null },
		tags: {}
	});
	if (o) Maggi.merge(data, o);
	commit.revive(data);
	return data;
};

commit.revive = function(data) {
	console.log("commit.revive");
	/*
	data.branch = function() {
		alert("TODO");
	};
	data.commit = function() {
		console.log("NOT GOOD");
		data.date = new Date().getTime();
		data.committed = true;
	};
	*/
};



commit.ui = function(prjdata) {
	var dateformat = function(dom, data, setdata, ui, datachange) {
		var up = function(data) {
			function make() {
				if (data == null) return dom.text();
				var now = new Date().getTime();
				var d = new Date(data);
				var text;
				var h = d.getHours();
				var m = d.getMinutes();
				var ss = d.getSeconds();
				var diff = now - data;
				/*
								var interval = 1000;
								var ticks = 60;
								var label = (tick) => (tick + " second" + ((tick == 1) ? "" : "s") + " ago");
				*/
				function pad(num, size) {
					var s = num + "";
					while (s.length < size) s = "0" + s;
					return s;
				}
				var spec = [{
					interval: 1000,
					ticks: 60,
					label: (tick) => (tick + " second" + ((tick == 1) ? "" : "s") + " ago")
				}, {
					interval: 1000 * 60,
					ticks: 60,
					label: (tick) => (tick + " minute" + ((tick == 1) ? "" : "s") + " ago")
				}, {
					interval: 1000 * 60 * 60,
					ticks: 24,
					label: (tick) => (tick + " hour" + ((tick == 1) ? "" : "s") + " ago")
				}, {
					interval: 1000 * 60 * 60 * 24,
					ticks: 7,
					label: (tick) => (tick + " day" + ((tick == 1) ? "" : "s") + " ago, " + pad(h, 2) + ":" + pad(m, 2) + ":" + pad(ss, 2))
				}, {
					interval: Infinity,
					ticks: 1,
					label: (tick) => " on " + new Date(data).toLocaleDateString() + ", " + pad(h, 2) + ":" + pad(m, 2) + ":" + pad(ss, 2)
				}];
				for (var i in spec) {
					var s = spec[i];
					if (diff < s.ticks * s.interval) {
						var tick = Math.floor(diff / s.interval);
						text = s.label(tick);
						if (s.interval < Infinity) {
							var remain = s.interval - (diff / s.interval - tick) * s.interval;
							setTimeout(make, remain);
						}
						break;
					}
				}
				dom.text(" " + text);
			}
			make();
		};
		datachange(up);
		up(data);
	};
	var committedformat = function(dom, data, setdata, ui, datachange) {
		var up = function(data) {
			if (data) dom.text(" committed ");
			else dom.text(" working on next commit");
		};
		datachange(up);
		up(data);
	};
	var idformat = function(dom, data, setdata, ui, datachange) {
		var up = function(data) {
			if (data) dom.text(data.substring(0, 8));
			else dom.text("");
		};
		datachange(up);
		up(data);
	};
	return {
		class: "commit",
		order: ["branch", "checkout", "message", "author", "committed", "id", "date", "tags", "commit", "stash"],
		children: {
			id: { type: "user", user: idformat },
			message: { type: "text" },
			author: {
				children: {
					name: "text",
					email: { type: "text", format: " <%s>" }
				}
			},
			committed: { type: "user", user: committedformat },
			date: { type: "user", user: dateformat },
			tags: { childdefault: "text" },
			branch: { type: "function", label: "branch from here", class: "button gray", visible: true, onClick: null },
			commit: { type: "function", label: "commit revision", class: "button red", enabled: false, visible: true, onClick: null },
			checkout: { type: "function", label: "checkout", class: "button gray", enabled: true, visible: true, onClick: null },
			stash: { type: "function", label: "stash", class: "button gray", enabled: true, visible: true, onClick: null }
		},
		builder: function(dom, data, ui) {
			var commitable = function() {
				var commitable = (data.message != "" && data.message != null && data.author.name != null && data.author.name != "" && data.author.email != null && data.author.email != "");
				ui.children.commit.enabled = commitable;
				ui.children.stash.enabled = commitable;
			};
			var co = function() {
				prjdata.checkout(data.id);
			};
			ui.children.checkout.onClick = co;
			var st = function() {
				prjdata.stash(data.id);
			};
			ui.children.stash.onClick = st;
			var ct = function() {
				prjdata.commit(data);
			};
			ui.children.commit.onClick = ct;
			var br = function() {
				var branch = window.prompt("Please enter name for the new branch");
				prjdata.branch(data.id, branch);
			};
			ui.children.branch.onClick = br;
			var comm = function() {
				ui.children.message = { true: "text", false: { type: "input", placeholder: "commit-message" } }[data.committed];
				ui.children.commit.visible = !data.committed;
				ui.children.branch.visible = data.committed;
				ui.children.checkout.visible = data.committed;
				ui.children.stash.visible = !data.committed;
			};
			return installBindings([
				[data, "set", "message", commitable],
				[data.author, "set", "name", commitable],
				[data.author, "set", "email", commitable],
				[data, "set", "committed", comm]
			]);
		}
	};
};
