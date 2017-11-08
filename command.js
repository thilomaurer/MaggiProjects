var command = function(m, dom) {
	m.data = command.exampledata();
	m.ui = command.ui;
	$('html').addClass("mui");
};

command.exampledata = function() {
	var data = command.data.git_clone();

	data.parameters.url = "https://github.com/example.git";
	data.parameters.branch = "master";
	/*
		m.data.command = "git_commit";
		m.data.parameters = {
			author: "Example User <user@example.com>",
			branch: "master",
			message: "test commit"
		};
	*/
	var p = data.parameters.progress;
	p.step = 0;
	p.steps = 50;

	var dir = 1;
	setInterval(function() {
		p.step += dir;
		if (p.step > p.steps) p.step = p.steps;
		if (p.step == p.steps)
			setTimeout(function() {
				dir *= -1;
			}, 1000);
	}, 30);

	setTimeout(function() {
		data.add("error", "error message");
	}, 1000);

	return data;
}

var progress = function() {

};

progress.data = function() {
	return {
		step: 0,
		steps: 2,
		eta: null,
	};
};

progress.ui = function() {
	return {
		class: "progress",
		children: {
			step: "text",
			of: { type: "label", label: "/" },
			steps: "text",
			ratio: { type: "label", label: "xx" },
			eta: {
				type: "text",
				format: "%d secs left",
				visible: false,
			}
		},
		builder(dom, data, ui) {
			var seteta = function(k, v) {
				ui.children.eta.visible = (v != null);
			};
			var setratio = function(k, v) {
				ui.children.ratio.label = Math.round(100 * data.step / data.steps) + "%";
			};
			var handlers = [
				[data, "set", "eta", seteta],
				[data, "set", "step", setratio],
				[data, "set", "steps", setratio],
			];
			return installBindings(handlers);
		}
	};
};

progress.barui = function() {
	return {
		class: "progressbar",
		visible: true,
		children: {
			bar: { type: "label", label: "", class: "visibilityanimate", visible: true },
		},
		builder(dom, data, ui) {
			var current = -1;
			var setratio = function(k, v) {
				var ratio = data.step / data.steps;
				if (ratio > 1) ratio = 1;
				if (ratio < 0) ratio = 0;
				if (current != ratio) {
					current = ratio;
					var percent = (100 * ratio) + "%";
					dom.find("#bar").css("width", percent);
					ui.children.bar.visible = (ratio != 1);
				}
			};
			var handlers = [
				[data, "set", "step", setratio],
				[data, "set", "steps", setratio],
			];
			return installBindings(handlers);
		}
	};
};

command.data = function(o) {
	var data = Maggi({
		command: null,
		parameters: {},
		progress: {}
	});
	if (o) Maggi.merge(data, o);
	return data;
};

command.data.git_clone = function() {
	return command.data({
		command: "git_clone",
		parameters: {
			url: null,
			branch: null,
			user: null,
			progress: progress.data()
		}
	});
};

command.ui = function() {
	return {
		class: "command",
		builder(dom, data, ui) {
			if (data == null) return;
			var bb;
			var rebuild = function(k) {
				if (k instanceof Array) return;
				if (bb) bb();
				var int_ui = {
					children: {
						parameters: command.ui[data.command] || command.ui.default,
						error: "text"
					}
				};
				var int_data = {
					parameters: 0
				};
				bb = Maggi.UI(dom, data, int_ui);
				return bb;
			};
			data.bind("set", rebuild);
			return rebuild();
		}
	};
};

command.ui.default = {
	children: {
		action: "text",
	}
};


command.ui.git_clone = {
	children: {
		action: { type: "label", label: "Cloning " },
		url: "text",
		sep: { type: "label", label: ":" },
		branch: "text",
		progress: progress.barui,
	}
};



command.ui.git_checkout = {
	children: {
		action: { type: "label", label: "Checking out " },
		branch: "text",
		sep: { type: "label", label: ":" },
		id: "text",
	}
};

command.ui.git_commit = {
	children: {
		action: { type: "label", label: "Committing" },
	}
};

command.ui.git_stash = {
	children: {
		action: { type: "label", label: "Stashing" },
	}
};

command.ui.git_pull = {
	children: {
		action: { type: "label", label: "Pulling from server" },
	}
};

command.ui.git_push = {
	children: {
		action: { type: "label", label: "Pushing to server" },
	}
};

command.ui.git_drop_stash = {
	children: {
		action: { type: "label", label: "Dropping stash  " },
		index: "text"
	}
};

command.ui.git_apply_stash = {
	children: {
		action: { type: "label", label: "Applying stash  " },
		index: "text"
	}
};

command.ui.git_write_files = {
	children: {
		action: { type: "label", label: "Writing files to project directory" },
	}
};

command.ui.npm_install = {
	children: {
		action: { type: "label", label: "Install npm dependencies" },
	}
};
