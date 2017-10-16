var main = function(m) {

	//ide_init(m);

	var ddd = new Date();
	var events = {
		ready: function() {
			console.log("Time to ready in ms:", (new Date()).getTime() - ddd.getTime());
			m.ui.children.connecting.visible = false;
		},
		disconnect: function() {
			console.warn("disconnect");
			m.ui.children.connecting.visible = true;
		},
		reconnect: function() {
			console.warn("reconnect");
			m.ui.children.connecting.visible = false;
		},
		reconnect_error: function() {
			console.warn("reconnect_error");
		},
		reconnect_attempt: function() {
			console.warn("reconnect_attempt");
		},
		reconnect_failed: function() {
			console.warn("reconnect_failed");
		},
	};

	m.data = { projects: {} };
	m.data = Maggi.db.client("Maggi.UI.IDE", events, m.data);
	m.bind("add", function(k, v) {
		if (k.length == 2 && k[0] == "data" && k[1] == "projects") {
			ide.revive(m.data);
			m.ui = ideui();
		}
	});
};
