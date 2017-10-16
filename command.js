var command = function(m, dom) {
	m.data = command.data();

	m.data.command = "git_clone";
	m.data.parameters = {
		url: "https://github.com/example.git",
		branch: "master"
	};
	m.data = null;
	m.ui = command.ui;
	$('html').addClass("mui");
};

command.data = function() {
	return {
		command: null,
		parameters: {}
	};
};

command.ui = function() {
	return {
		class: "command",
		builder(dom, data, ui) {
			if (data == null) return;
			var bb;
			var rebuild = function() {
				if (bb) bb();
				var int_ui = command.ui[data.command] || command.ui.default;
				bb = Maggi.UI(dom, data.parameters, int_ui);
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


var commands = {
	ui: {
		childdefault: command.ui,
		visible: false,
		children: {
			activity: { type: "label", class: "ion-md-add" }
		},
		order: ["activity"],
		builder(dom, data, ui) {
			var up = function() {
				var n = Object.keys(data).length;
				ui.visible = (n > 0);
				console.log(n > 0);
				var o = ["activity"].concat(Object.keys(data));
				ui.order = o;
				console.log(o);
			};
			if (data) {
				up();
				data.bind("add", up);
				data.bind("remove", up);
			}
		}
	},
};
