var makeProjectCreator = function(dom, result) {
	var res = function(project) {
		removeOverlay();
		result(project);
	};
	var data = Maggi({
		empty: function() {
			res(project.samples.Maggi);
		},
		pwcalc: function() {
			res(project.samples.pwcalc);
		},
		import: {
			data: {
				url: "https://github.com/thilomaurer/pwcalc.git",
				branch: "master",
			},
			import: function() {
				var prj = complete => project.data_from_git({ name: "<nobody>", username: "username", email: "user@localhost" },
					data.import.data.url,
					data.import.data.branch,
					complete);
				res(prj);
			}
		},
		cancel: function() {
			res(null);
		}
	});
	var ui = Maggi({
		class: "popup project_creator",
		children: {
			title: { type: "label", label: "Create New Project" },
			templates_label: { type: "label", label: "Templates" },
			empty: { type: "function", class: "blue button", label: "empty project" },
			pwcalc: { type: "function", class: "blue button", label: "Password Calculator" },
			import_label: { type: "label", label: "Import GIT repository" },
			import: {
				class: "cols",
				children: {
					data: {
						children: {
							url: { type: "input", prefix: "URL:\xa0", placeholder: "git@github.com:user/example.git",class:"first" },
							branch: { type: "input", prefix: "branch:\xa0", placeholder: "branch" },
						}
					},
					import: { type: "function", class: "blue button ", label: "Import", enabled: false }
				}
			},
			cancel: { type: "function", class: "button", label: "Cancel" },
		},
		builder: function(dom, data, ui) {
			var valid = function(k, v) {
				ui.children.import.children.import.enabled = (v != "");
			};
			data.import.data.bind("set", "url", valid);
			valid("url", data.import.data.url);
		}
	});
	var removeOverlay = Maggi.UI.overlay(dom, data, ui);
};

var project_creator = function(m) {
	var data = {};
	makeProjectCreator($('body'), function(result) {
		console.log(result);
	});
	$('html').addClass("mui");
};
