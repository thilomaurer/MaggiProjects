var project = function(m, dom) {

	var recreate = function(p) {
		p = JSON.parse(JSON.stringify(p));
		p = Maggi(p);
		project.revive(p);
		return p;
	};
	var apply = function(p) {
		//p = recreate(p);
		m.data = p;
		m.ui = prjui;
		/*
				setTimeout(function() {
					m.data.history = commithistory.exampledata();
				}, 10000);
				*/
	};
	//project.samples.Maggi(apply);
	project.samples.pwcalc(apply);
	/*
	project.data_from_git({ name: "<nobody>", email: "user@localhost" },
		"https://github.com/thilomaurer/MaggiProjects.git",
		"master",
		apply);
*/
	dom.addClass("expand");
};

project.data = function(o) {
	var data = Maggi({
		id: null,
		files: {},
		freefileid: 0,
		view: {
			panes: {
				order: {}
			}
		},
		commands: {},
		checkedout: {
			branch: null,
			id: null
		},
		repo: repo.data(),
		options: {
			colorscheme: "auto",
			user: {
				name: null,
				email: null,
			},
			editor: {
				colorscheme: {
					day: "maggiui",
					night: "maggiui"
				},
				gutter: {
					showGutter: true,
					fixedWidthGutter: true,
					highlightGutterLine: true,
					showLineNumbers: true,
				},
				ui: {
					animatedScroll: false,
					hScrollBarAlwaysVisible: false,
					vScrollBarAlwaysVisible: false,
					showPrintMargin: false,
					printMarginColumn: 80,
					fadeFoldWidgets: false,
					showFoldWidgets: true,
					scrollPastEnd: true,
					highlightActiveLine: true,
					highlightSelectedWord: true,
				},
				editing: {
					showInvisibles: false,
					displayIndentGuides: true,
					useSoftTabs: false,
					tabSize: 4,
					cursorStyle: "ace",
					selectionStyle: "line",
					keyboard: "gui"
				}
			}
		}
	});
	if (o) Maggi.merge(data, o);
	project.revive(data);
	return data;
};

project.revive = function(data) {
	console.log("project.revive");
	data.options.user.bind("set", "name", (k, v) => { if (data.repo.history[0].id == null) data.repo.history[0].author.name = v; });
	data.options.user.bind("set", "email", (k, v) => { if (data.repo.history[0].id == null) data.repo.history[0].author.email = v; });
	Maggi.revive(data, {
		repo: repo.revive
	});

	data.addfile = function(file) {
		file = filedata(file);
		var fileid = data.freefileid++;
		data.files.add(fileid, file);
		return fileid;
	};
	data.addcommand = function(cmd) {
		var ck = Object.keys(data.commands).sort((a, b) => (a - b));
		var lk = ck.pop() || 0;
		var key = lk + 1;
		data.commands.add(key, command.data(cmd));
		return key;
	};
	data.push = function() {
		data.addcommand({
			command: "git_push",
			parameters: {
//				id: id
			}
		});
	};
	data.pull = function() {
		data.addcommand({
			command: "git_pull",
			parameters: {
//				id: id
			}
		});
	};
	data.branch = function(id, branch) {
		data.addcommand({
			command: "git_branch",
			parameters: {
				id: id,
				branch: branch
			}
		});
	};
	data.commit = function(cc) {
		var c = commit.data(cc);
		c.author = { name: data.options.user.name, email: data.options.user.email };
		data.addcommand({
			command: "git_commit",
			parameters: c
		});
	};
	data.clone = function(url, branch, user) {
		data.addcommand({
			command: "git_clone",
			parameters: {
				url: url,
				branch: branch,
				user: user,
			}
		});
	};
	data.checkout = function(id) {
		data.addcommand({
			command: "git_checkout",
			parameters: {
				id: id,
				branch: data.checkedout.branch
			}
		});
	};
	data.stash = function(id) {
		var prev_commit = data.repo.history[0];
		data.commands.add(0, {
			command: "git_stash",
			parameters: {
				author: { name: data.options.user.name, email: data.options.user.email },
				message: prev_commit.message
			}
		});
	};
	data.apply_stash = function(index) {
		data.addcommand({
			command: "git_apply_stash",
			parameters: {
				index: index,
			}
		});
	};
	data.drop_stash = function(index) {
		data.addcommand({
			command: "git_drop_stash",
			parameters: {
				index: index,
			}
		});
	};
	data.git_init = function() {
		data.addcommand({
			command: "git_init",
			parameters: {
			}
		});
	};
	data.write_files = function() {
		data.addcommand({
			command: "git_write_files",
			parameters: {
			}
		});
	};
};

Maggi.UI.labelwrap = function(dom, data, setdata, ui, onDataChange) {

	var int_ui = {
		class: "cols labelwrap",
		children: {
			label: { type: "label", label: ui.label },
			data: ui.d
		}
	};
	var int_data = Maggi({ data: data });
	int_data.bind("set", "data", function(k, v) {
		setdata(v);
	});
	onDataChange(function(data) {
		int_data.data = data;
	});
	Maggi.UI(dom, int_data, int_ui);
};

project.ui = function() {
	var colorselectui = {
		type: "select_OS",
		choices: {
			ambiance: { label: "Ambiance" },
			chaos: { label: "Chaos" },
			chrome: { label: "Chrome" },
			clouds: { label: "Clouds" },
			clouds_midnight: { label: "Clouds Midnight" },
			cobalt: { label: "Cobalt" },
			crimson_editor: { label: "Crimson Editor" },
			dawn: { label: "Dawn" },
			dreamweaver: { label: "Dreamweaver" },
			eclipse: { label: "Eclipse" },
			github: { label: "Github" },
			idle_fingers: { label: "Idle Fingers" },
			iplastic: { label: "Iplastic" },
			katzenmilch: { label: "Katzenmilch" },
			kr_theme: { label: "Kr Theme" },
			kuroir: { label: "Kuroir" },
			merbivore: { label: "Merbivore" },
			merbivore_soft: { label: "Merbivore_soft" },
			mono_industrial: { label: "Mono_industrial" },
			monokai: { label: "Monokai" },
			pastel_on_dark: { label: "Pastel on Dark" },
			solarized_dark: { label: "Solarized Dark" },
			solarized_light: { label: "Solarized Light" },
			sqlserver: { label: "Sqlserver" },
			terminal: { label: "Terminal" },
			textmate: { label: "Textmate" },
			tomorrow: { label: "Tomorrow" },
			tomorrow_night_blue: { label: "Tomorrow Night Blue" },
			tomorrow_night_bright: { label: "Tomorrow Night Bright" },
			tomorrow_night_eighties: { label: "Tomorrow Night Eighties" },
			tomorrow_night: { label: "Tomorrow Night" },
			twilight: { label: "Twilight" },
			vibrant_ink: { label: "Vibrant Ink" },
			xcode: { label: "Xcode" },
			maggiui: { label: "Maggi.UI" },
		}
	};
	return {
		children: {
			connector: null,
			optionsicon: { type: "label", class: "ion-ios-settings icon visibilityanimate" },
			options: {
				popup: true,
				popuptrigger: "optionsicon",
				class: "scroll",
				children: {
					colorscheme: {
						type: "labelwrap",
						label: "Color Scheme",
						d: {
							type: "select",
							choices: {
								"auto": { label: "auto" },
								"light": { label: "light" },
								"dark": { label: "dark" },
							}
						}
					},
					userlabel: { type: "label", label: "USER" },
					user: {
						children: {
							name: { type: "input", class: "first", placeholder: "Full Name" },
							email: { type: "input", kind: "email", placeholder: "email" }
						}
					},
					editor: {
						children: {
							editinglabel: { type: "label", label: "EDITING" },
							editing: {
								class: "simplelist",
								children: {
									showInvisibles: { type: "checkbox", label: "Show Invisibles", class: "toggle", labelposition: "before" },
									displayIndentGuides: { type: "checkbox", label: "Display Indent Guides", class: "toggle", labelposition: "before" },
									useSoftTabs: { type: "checkbox", label: "Use Soft Tabs", class: "toggle", labelposition: "before" },
									tabSize: {
										type: "labelwrap",
										label: "Tab Size",
										d: { type: "input", placeholder: "tab size" },
									},
									selectionStyle: {
										type: "labelwrap",
										label: "Selection Style",
										d: {
											type: "select",
											choices: {
												text: { label: "text" },
												line: { label: "line" }
											}
										}
									},
									cursorStyle: {
										type: "labelwrap",
										label: "Cursor Style",
										d: {
											type: "select",
											choices: {
												ace: { label: "ace" },
												slim: { label: "slim" },
												smooth: { label: "smooth" },
												wide: { label: "wide" }
											}
										}
									},
									keyboard: {
										type: "labelwrap",
										label: "Input Style",
										d: {
											type: "select",
											choices: {
												gui: { label: "GUI" },
												vim: { label: "VIM" },
												emacs: { label: "Emacs" }
											}
										}
									}
								}
							},
							colorschemelabel: { type: "label", label: "COLOR SCHEME" },
							colorscheme: {
								class: "simplelist",
								children: {
									day: {
										type: "labelwrap",
										label: "Day Scheme",
										d: colorselectui
									},
									night: {
										type: "labelwrap",
										label: "Night Scheme",
										d: colorselectui
									}
								}
							},
							gutterlabel: { type: "label", label: "GUTTER" },
							gutter: {
								class: "simplelist",
								children: {
									showGutter: { type: "checkbox", label: "Show Gutter", class: "toggle", labelposition: "before" },
									fixedWidthGutter: { type: "checkbox", label: "Fixed Gutter Width", class: "toggle", labelposition: "before" },
									showLineNumbers: { type: "checkbox", label: "Show Line Numbers", class: "toggle", labelposition: "before" },
									highlightGutterLine: { type: "checkbox", label: "Highlight Gutter Line", class: "toggle", labelposition: "before" },
								}
							},
							uilabel: { type: "label", label: "USER INTERFACE" },
							ui: {
								class: "simplelist",
								children: {
									animatedScroll: { type: "checkbox", label: "Animate Scrolling", class: "toggle", labelposition: "before" },
									showPrintMargin: { type: "checkbox", label: "Show Print Margin", class: "toggle", labelposition: "before" },
									printMarginColumn: {
										type: "labelwrap",
										label: "Print Margin",
										d: { type: "input", placeholder: "column" }
									},
									showFoldWidgets: { type: "checkbox", label: "Show Fold Widgets", class: "toggle", labelposition: "before" },
									fadeFoldWidgets: { type: "checkbox", label: "Fade Fold Widgets", class: "toggle", labelposition: "before" },
									scrollPastEnd: { type: "checkbox", label: "Scroll Past End", class: "toggle", labelposition: "before" },
									hScrollBarAlwaysVisible: { type: "checkbox", label: "Persistent HScroll", class: "toggle", labelposition: "before" },
									vScrollBarAlwaysVisible: { type: "checkbox", label: "Persistent VScroll", class: "toggle", labelposition: "before" },
									highlightActiveLine: { type: "checkbox", label: "Highlight Active Line", class: "toggle", labelposition: "before" },
									highlightSelectedWord: { type: "checkbox", label: "Hightlight Selected Word", class: "toggle", labelposition: "before" },
								}
							}
						}
					},
				},
				builder: function(dom, data, ui) {
					if (data == null) return;
					var bindings = [
						[data, "set", "colorscheme", function(k, v, oldv) {
							if (v == "auto") {
								var h = new Date().getHours();
								if (h > 6 && h < 17) v = "light";
								else v = "dark";
							}
							var cls = { "light": "mui-light", "dark": "mui" };
							$('html').removeClass("mui-light");
							$('html').removeClass("mui");
							$('html').addClass(cls[v]);
						}]
					];
					return installBindings(bindings);
				}
			},
			prjjson: {
				data: null,
				children: {
					icon: "image",
					name: "text"
				},
				class: "prjjson hoverhighlight"
			},
			prjjson_actions: {
				data: {},
				popup: true,
				popuptrigger: "prjjson",
				children: {
					actions: null
				}
			},
			commands: commands.ui,
			checkedout: {
				children: {
					branch: "text",
					id: { type: "text", format: ":%s" }
				},
				class: "visibilityanimate hoverhighlight"
			},
			repo: {
				popup: true,
				popuptrigger: "checkedout",
				children: {},
				selected: null,
				builder: null,
				class: "scroll"
			},
			repo: null,
			spacer: {}
		},
		order: ["connector", "prjjson", "prjjson_actions", "checkedout", "repo", "spacer", "commands", "optionsicon", "options"],
		class: "project",
		builder: function(dom, data, ui) {
			if (data == null) return;
			/*
			var buildHistoryView = function(dom, d, ui) {
				var int_data = Maggi({
					history: d,
					stashes: {},
					branches: { 0: "master" }
				});
				var int_ui = Maggi({
					visible: ui.visible,
					children: {
						branchLabel: { type: "label", label: "BRANCHES", class: "listlabel" },
						branches: { childdefault: "text" },
						stashLabel: { type: "label", label: "STASHES", class: "listlabel" },
						stashes: commithistory.ui,
						historyLabel: { type: "label", label: "HISTORY", class: "listlabel" },
						history: commithistory.ui(data),
					}
				});
				ui.bind("set", "selected", function(k, v) {
					int_ui.children.repo.children.history.selected = v;
				});
				int_ui.children.repo.children.history.selected = ui.selected;
				int_ui.children.repo.children.history.bind("set", "selected", function(k, v) {
					ui.selected = v;
				});
				return Maggi.UI(dom, int_data, int_ui);
			};

			ui.children.history.builder = buildHistoryView;
			*/
			ui.children.repo = repo.popupui(data);
			/*
			var buildRepoView = function(dom, d, ui) {
				var int_data = Maggi({
					repo: d,
				});
				var int_ui = Maggi({
					visible: ui.visible,
					children: {
						repo: repo.ui()
					}
				});
				ui.bind("set", "selected", function(k, v) {
					int_ui.children.repo.children.history.selected = v;
				});
				int_ui.children.repo.children.history.selected = ui.selected;
				int_ui.children.repo.children.history.bind("set", "selected", function(k, v) {
					ui.selected = v;
				});
				return Maggi.UI(dom, int_data, int_ui);
			};
			//ui.children.repo.builder = buildRepoView;
			*/
			var genprjjsondata = function(cb) {
				var k = childwithkv(data.files, "name", "package.json");
				var update = function() {
					var d;
					try {
						d = JSON.parse(k.data);
						var i = d["Maggi.js"] && d["Maggi.js"].link && d["Maggi.js"].link.icon;
						d.name = d["Maggi.js"] && d["Maggi.js"].title || d.name;
						d.icon = i;
						var files = data.files;
						for (var fidx in files) {
							var f = files[fidx];
							if (f.name == i)
								d.icon = "data:" + f.type + ";" + f.enc + "," + f.data;
						}
					} catch (e) {}
					cb(d);
				};
				if (k != null)
					k.bind("set", "data", update);
				update();
			};
			genprjjsondata(function(data) {
				var u = ui.children.prjjson;
				if (data == null) data = { name: "[unnamed]" };
				u.data = data;
			});

			var setcoid = function(k) {
				var id = data.checkedout.id;
				var e = Object.entries(data.repo.history).find(function(v) {
					return (v[1].id == id);
				});
				if (e) ui.children.repo.children.history.selected = e[0];
			};
			var handlers = [
				[data, "set", "checkedout", setcoid],
				[data, "set", "history", setcoid],
			];

			return installBindings(handlers);
		}
	};
};


var childwithkv = function(o, key, value) {
	for (var k in o)
		if (o[k] instanceof Object && value == o[k][key]) return o[k];
	return null;
};

project.data_from_files = function(user, sources, complete) {

	var mime = {
		js: "application/javascript",
		html: "text/html",
		css: "text/css",
		txt: "text/plain",
		md: "text/markdown",
		json: "application/json",
		svg: "image/svg+xml"
	};

	var data = project.data();
	var rev = 0;
	data.options.user = user;

	var files = data.files;
	data.repo.refs.branches = ["master"];
	data.repo.history.add(0, commit.data({ author: {name:user.name, email: user.email }}));
	data.checkedout.branch = "master";
	data.checkedout.id = null;
	data.git_init();

	var nfloaded = 0;
	$.each(sources, function(idx, k) {
		var fn = k;
		if (k instanceof Array) {
			fn = k[0];
			k = k[1];
		}
		var parts = k.split(".");
		var type = "txt";
		if (parts.length > 0) type = parts[parts.length - 1];
		var fileid = data.addfile({ name: fn, type: mime[type] });
		$.get(k, null, function(rawdata) {
			files[fileid].data = rawdata;
			nfloaded++;
			if (nfloaded == sources.length) filesloaded();
		}, "text");
	});

	var filesloaded = function() {
		complete(data);
	};
	if (sources.length == 0) {
		data.addfile({ name: "main.js", type: mime["js"] });
		filesloaded();
	}
};

project.data_from_git = function(user, git_url, git_branch, complete) {
	var data = project.data();
	data.clone(git_url, git_branch, user);
	complete(data);
};


project.samples = {};

project.samples.Maggi = function(complete) {
	project.data_from_files({ name: "Example User", email: "user@example.com" }, [
			["package.json", "demos/empty/project.json"],
			["main.js", "demos/empty/main.js"],
			["index.html", "demos/empty/index.html"],
		],
		function(project) {
			project.view.panes.add(0, { mode: "edit", filename: "package.json" });
			project.view.panes.add(1, { mode: "edit", filename: "main.js" });
			project.view.panes.add(2, { mode: "preview", filename: "main.js" });
			project.view.panes.order = ["0", "1", "2"];

			complete(project);
		}
	);
};

project.samples.pwcalc = function(complete) {
	project.data_from_files({ name: "Thilo Maurer", email: "tm@thilomaurer.de" }, [
			["package.json", "demos/pwcalc/project.json"],
			["README.md", "demos/pwcalc/README.md"],
			["index.html", "demos/pwcalc/index.html"],
			["pwcalc.js", "demos/pwcalc/pwcalc.js"],
			["pwcalc.css", "demos/pwcalc/pwcalc.css"],
			["utils.js", "demos/pwcalc/utils.js"],
			["lock.svg", "demos/pwcalc/lock.svg"]
		],
		function(project) {
			project.view.panes.add(0, { mode: "edit", filename: "README.md" });
			project.view.panes.add(1, { mode: "edit", filename: "pwcalc.js" });
			project.view.panes.add(2, { mode: "edit", filename: "pwcalc.css" });
			project.view.panes.add(3, { mode: "preview", filename: "pwcalc.js" });
			project.view.panes.order = ["0", "1", "2", "3"];
			complete(project);
		}
	);
};
