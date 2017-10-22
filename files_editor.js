var files_editor = function(m, dom) {
	var f = Maggi(files.exampledata());
	var ui = Maggi({ addfile: null, visible: true });
	m.data = files_editor.data(f);
	m.ui = files_editor.ui(ui);
	m.ui.visible = true;

	ui.addfile = function(file) {
		var key = "_testing_key-" + Object.keys(f).length;
		f.add(key, file);
		return key;
	};
	ui.bind("set", "visible", function(k, v) {
		alert(k + " " + v);
	});
	$("html").addClass("mui");
};


files_editor.data = function(files) {
	return {
		files: files,
		matchedfiles: files,
		filename: "",
		count: null,
		actions: {
			adder: { type: "class:ion-md-add", name: "Add File..." }
		},
	};
};

files_editor.ui = function(ext_ui) {
	return {
		visible: false,
		children: {
			actions: listui(),
			filesLabel: { type: "label", label: "FILES", class: "listlabel" },
			filename: { type: "input", placeholder: "search by name or content" },
			count: { type: "text", format: "%d matching files" },
			matchedfiles: filesui()
		},
		builder: function(dom, data, ui) {
			ui.children.actions.children.adder.add("enabled", true);
			ui.children.actions.children.adder.enabled = false;
			if (ext_ui.addfile == null) ext_ui.add("addfile", null);

			var setaddfile = function(k, v) {
				ui.children.actions.children.adder.enabled = (v instanceof Function);
			};
			var setselectedaction = function(k, v) {
				if (v == "adder") {
					var filekey = ext_ui.addfile(filedata());
					data.matchedfiles.add(filekey, data.files[filekey]);
					ui.children.matchedfiles.children[filekey].editvisible = true;
				}
				ui.children.actions.selected = null;
			};
			var setselectedfile = function(k, v) {
				if (v != null) {
					ext_ui.selected = v;
					ext_ui.visible = false;
				}
			};
			var setselectedmatchedfile = function(k, v) {
				if (v != null) {
					var filename = data.matchedfiles[v].name;
					files_index = Object.entries(data.files).find(f => f[1].name == filename);
					ext_ui.selected = files_index&&files_index[0];
					ext_ui.visible = false;
				}
			};
			var updatematches = function(v) {
				var matched = Object.values(data.files).filter(f => v == "" ? true : (f.name && f.name.includes(v)) || (f.data && f.data.includes(v)));
				ui.children.matchedfiles.selected=null;
				data.matchedfiles = matched;
				data.count = matched.length;
			};
			var setfilename = function(k, v) {
				updatematches(v);
			};
			var handlers = [
				[ext_ui, "set", "addfile", setaddfile],
				[ui.children.actions, "set", "selected", setselectedaction],
				[ui.children.files, "set", "selected", setselectedfile],
				[ui.children.matchedfiles, "set", "selected", setselectedmatchedfile],
				[data, "set", "filename", setfilename]
			];
			return installBindings(handlers);
		}
	};
};
