var commands = function(m,dom) {
	m.data = {
		0: command.exampledata(),
		1: command.exampledata()
	};
	m.ui = commands.ui;
	$('html').addClass("mui");
};

commands.ui = function() {
	return {
		class:"commands",
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
				var o = ["activity"].concat(Object.keys(data));
				ui.order = o;
			};
			if (data) {
				up();
				data.bind("add", up);
				data.bind("remove", up);
			}
		}
	};
};
