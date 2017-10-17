var panedata = function() {
	var files = Maggi({});
	var f = { name: undefined, type: undefined, data: "", cursor: { row: 0, column: 0 } };
	var p = Maggi({
		file: f,
		filename: f.name,
		files: files,
		addfile: null,
		mode: "edit",
		readonly: false,
		showcontrols: true,
		edit: { file: f },
		actions: {},
		preview: {
			detach: false,
			reload: 0,
			file: null,
			files: files
		}
	});
	p.bind(function(k, v) {
		if (k == "files") p.preview.files = v;
	});
	p.actions.add("closepane", function() {
		p.trigger("closepane");
	});
	p.actions.add("insertpane", function() {
		p.trigger("insertpane");
	});
	return p;
};

var buildFilesEdit = function(dom, data, ui) {
	int_data = Maggi(files_editor.data(data));
	int_ui = files_editor.ui(ui);
	return Maggi.UI(dom, int_data, int_ui);
};

var paneuiheader = function() {
	return Maggi({
		visible: true,
		children: {
			file: fileui,
			files: {
				popup: true,
				popuptrigger: "file",
				order: [],
				builder: buildFilesEdit,
				selected: null,
				class: "scroll"
			},
			//mode:{type:"select",choices:{edit:{label:"edit"},preview:{label:"preview"}},visible:true},
			preview: { type: "label", class: "icon ion-ios-play", visible: false },
			options: { type: "label", class: "icon ion-ios-more" },
			actions: {
				popup: true,
				popuptrigger: "options",
				children: {
					closepane: { type: "function", label: "close pane", class: "button red" },
					insertpane: { type: "function", label: "insert pane", class: "button" },
				}
			},
			editor_actions: {
				data: {},
				children: {
					beautify: { type: "label", class: "icon ion-ios-color-wand", visible: true },
				}
			},
			preview_actions: {
				data: {},
				children: {
					reload: { type: "label", class: "icon ion-md-refresh" },
					detach: { type: "label", class: "icon ion-ios-browsers" }
				}
			},
			spacer: { type: "label" }
		},
		order: ["file", "files", "spacer", "editor_actions", "preview_actions", "mode", "preview", "options", "actions"],
		class: "paneheader",
		builder: function(dom, data, ui) {
			if (data == null) return;

			var setaddfile = function(k, v) {
				ui.children.files.addfile = data.addfile;
			};
			var removeFile = function(k, v) {
				if (k instanceof Array) return;
				updateFile();
			};
			var updateFile = function() {
				var v = ui.children.files.selected;
				if (parseInt(v) >= 0)
					data.filename = (data.files[v] && data.files[v].name) || undefined;
				//else data.filename = undefined;
			};
			dom.ui.actions.ui.closepane.click(function() {
				ui.children.actions.visible = false;
			});
			dom.ui.actions.ui.insertpane.click(function() {
				ui.children.actions.visible = false;
			});
			dom.ui.preview.click(function() {
				var m = "edit";
				if (data.mode == m) m = "preview";
				data.mode = m;
			});
			dom.ui.preview_actions.ui.detach.click(function() {
				data.preview.detach = !data.preview.detach;
			});
			dom.ui.preview_actions.ui.reload.click(function() {
				data.preview.reload += 1;
			});
			dom.ui.editor_actions.ui.beautify.click(function() {
				data.file.beautify();
			});
			var updateMode = function(k, v) {
				var p = (v == "preview");
				var e = (v == "edit");
				ui.children.editor_actions.add("visible", e);
				ui.children.preview_actions.add("visible", p);
				if (p) {
					var dc = ui.children.preview_actions.children.detach;
					data.preview.bind("set", "detach", function(k, v) {
						if (v) dc.class += " activated";
						else dc.class = dc.class.split(" ").filter(s => s != "activated").join(" ");
					});
				}
				var dp = ui.children.preview;
				if (p) dp.class = "icon ion-md-play activated";
				else dp.class = "icon ion-md-play";
			};
			var previewTypes = ["text/javascript", "application/javascript", "text/html", "text/markdown"];
			var updateModeVis = function(k, v) {
				var canpreview = v ? v.can_preview() : false;
				ui.children.preview.visible = canpreview;
				if (canpreview === false) data.mode = "edit";
				ui.children.editor_actions.children.beautify.visible = v ? v.can_beautify() : false;
			};
			var updateRO = function(k, v) {
				var editlabel = "edit";
				if (v == true) editlabel = "view";
				ui.children.mode = { type: "select", choices: { edit: { label: editlabel }, preview: { label: "preview" } }, visible: true };
			};
			data.files.bind("remove", removeFile);
			var handlers = [
				[data, "set", "mode", updateMode],
				[ui.children.files, "set", "selected", updateFile],
				[data, "set", "files", updateFile],
				[data, "set", "file", updateModeVis],
				[data, "set", "readonly", updateRO],
				[data, "set", "addfile", setaddfile]
			];
			return installBindings(handlers);
		}
	});
};

var installBindings = function(handlers) {
	$.each(handlers, function(idx, v) {
		var o = v[0];
		var e = v[1];
		var k = v[2];
		var f = v[3];
		if (o != null) {
			o.bind(e, k, f);
			f(k, o[k]);
		} else console.log("bind to null ignored");
	});
	return function() {
		$.each(handlers, function(idx, v) {
			var o = v[0];
			var e = v[1];
			var k = v[2];
			var f = v[3];
			if (o != null) {
				o.unbind(e, f); //TODO: (e,k,f);
			} else console.log("unbind from null ignored");
		});
	};
};

var paneui = function() {
	return {
		children: {
			header: paneuiheader(),
			preview: { type: "user", user: previewui, class: "flexrows" },
			edit: { type: "editor", class: "flexrows", readonly: false, settings: { colorscheme: { day: "maggiui" }, editing: { useSoftTabs: false, displayIndentGuides: true, showInvisibles: true } } },
			empty: { type: "label", label: "no file selected" }
		},
		projectid: null,
		order: ["header", "edit"],
		class: "pane flexrows",
		builder: function(dom, data, ui) {
			var updateMode = function(k, v) {
				if (data.file == null) v = "empty";
				ui.order = ["header", v];
			};
			var updateRO = function(k, v) {
				ui.children.edit.readonly = v;
			};
			var updateSH = function(k, v) {
				ui.children.header.visible = v;
			};
			var updateFile = function(k, v) {
				var filename = data.filename;
				var fileentry = Object.entries(data.files).find(file => file[1].name == filename);
				var f = fileentry && fileentry[1] || null;
				data.file = f;
				data.preview.file = f;
				data.edit.file = f;
				updateMode("mode", data.mode);
			};
			var upid = function(k, v) {
				ui.children.preview.basepath = "projects/" + v + "/";
			};
			var handlers = [
				[ui, "set", "projectid", upid],
				[data, "set", "files", updateFile],
				[data, "set", "filename", updateFile],
				[data, "set", "mode", updateMode],
				[data, "set", "readonly", updateRO],
				[data, "set", "showcontrols", updateSH]
			];
			var ppp = installBindings(handlers);
			ui.children.header.add("data", data);
			return ppp;
		}
	};
};

var pane = function(m, dom) {
	m.data = panedata();
	m.data.files = files.exampledata();

	m.ui = paneui();

	m.data.filename = "file.css";
	$("html").addClass("mui");
	dom.addClass("expand");
	return;
	setTimeout(function() {
		m.data.files = {};
		console.log(m.data);
	}, 1000);
};
