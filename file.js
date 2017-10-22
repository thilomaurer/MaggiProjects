var file = function(m, dom) {
	m.data = filedata({ name: "test.name", type: "tex/css", removed: true });
	m.ui = fileui();
	m.ui.add("enabled", true);
	m.ui.enabled = false;
	//$("html").addClass("mui");
};


file.count_nonblanks_before_cursor = function() {
	var c = this.cursor;
	var d = this.data;

	function getPosition(string, subString, row, column) {
		var l = string.split(subString, row + 1);
		l[row] = l[row].substring(0, column);
		var p = l.join(subString).length;
		return p;
	}
	var count_nonblanks = function(string) {
		return (string.match(/\S/g) || []).length;
	};
	var p = getPosition(d, "\n", c.row, c.column);
	var nbl = count_nonblanks(d.substring(0, p));
	return nbl;
};

file.cursor_after_nonblanks = function(nbl) {
	var d = this.data;
	var p = d.split('').reduce(function(acc, c, i) {
		if (acc.nbl < nbl) {
			if (c.match(/\S/)) acc.nbl++;
			acc.i = i + 1;
		}
		return acc;
	}, { nbl: 0, i: -1 });
	d = d.substring(0, p.i);
	var l = d.split("\n");
	var row = l.length - 1;
	var column = l[row].length;
	return { row, column };
};

file.can_beautify = function() {
	var types = ["text/javascript", "application/javascript", "text/html", "text/css", "application/json"];
	return (types.indexOf(this.type) >= 0);
};

file.can_preview = function() {
	var types = ["text/javascript", "application/javascript", "text/html", "text/markdown"];
	return (types.indexOf(this.type) >= 0);
};

file.beautify = function() {
	var ff = {
		"text/javascript": js_beautify,
		"application/javascript": js_beautify,
		"application/json": js_beautify,
		"text/html": html_beautify,
		"text/css": css_beautify,
	};
	var fn = ff[this.type];
	if (!fn) return;
	var options = {
		"indent_with_tabs": true,
		"end_with_newline": true,
		"brace_style": "collapse-preserve-inline",
		"html": {
			"indent_inner_html": true,
			"extra_liners": [],
			"js": {
				"end_with_newline": false,
			},
			"css": {
				"end_with_newline": false,
			}
		},
		"css": {},
		"js": {}
	};

	var d = this.data;
	var c = this.cursor;
	var nbl = this.count_nonblanks_before_cursor();
	d = fn(d, options);
	c = this.cursor_after_nonblanks(nbl);
	this.data = d;
	this.cursor = c;
};

var filedata = function(o) {
	var fd = { name: null, type: null, enc: null, data: null, cursor: { row: 0, column: 0 }, removed: false };
	$.extend(fd, o);
	fd = Maggi(fd);
	fd.count_nonblanks_before_cursor = file.count_nonblanks_before_cursor;
	fd.cursor_after_nonblanks = file.cursor_after_nonblanks;
	fd.beautify = file.beautify;
	fd.can_beautify = file.can_beautify;
	fd.can_preview = file.can_preview;
	return fd;
};

var fileui = function() {
	var removed_user = function(dom, data, setdata, ui, datachange) {
		var up = function(data) {
			if (data) dom.text("(removed)");
			else dom.text("");
		};
		datachange(up);
		up(data);
	};


	var ui = listitemui();
	ui.children.removed = { type: "user", user: removed_user };
	ui.children.details = { type: "label", class: "icon ion-ios-more", visible: true };
	ui.editvisible = false;
	ui.mode = "";
	ui.class += " file";
	ui = Maggi(ui);
	ui.builder = function(dom, data, ui) {
		var repairfile = function(data) {
			var bp = filedata();
			for (var k in bp) {
				if (data != null)
					if (data[k] == null) data.add(k, bp[k]);
			}
		};
		repairfile(data);
		var click = function() {
			ui.editvisible = true;
			return false;
		};
		var showEditor = function(k, v) {
			if (v === true) {
				makeFileEditor($('body'), data, function() {
					ui.editvisible = false;
				});
			}
		};
		ui.children.details.add("onClick", click);
		ui.bind("set", "editvisible", showEditor);
		return function() {
			ui.unbind(showEditor);
		};
	};
	return ui;
};

var fileeditui = function() {

	var loc = function(dom, data, setdata, ui, datachange) {
		var up = function(data) {
			var text = "empty file";
			if (data !== null)
				text = data.length + " characters, " +
				data.split(/\s+/).length + " words, " +
				data.split("\n").length + " lines";
			dom.text("Summary: " + text);
		}
		datachange(up);
		up(data);
	};

	return {
		children: {
			type: {
				type: "select",
				choices: {
					"application/javascript": { label: "JS" },
					"text/html": { label: "HTML" },
					"text/css": { label: "CSS" },
					"text/plain": { label: "TXT" },
					"text/markdown": { label: "MD" },
					"image/svg+xml": { label: "SVG" },
					"application/json": { label: "JSON" }
				},
				class: "fillhorizontal"
			},
			name: { type: "input", placeholder: "filename", prefix: "Filename:\xa0" },
			cursor: {
				children: {
					label: { type: "label", label: "Cursor Position: line " },
					row: "text",
					label2: { type: "label", label: ", column " },
					column: "text"
				}
			},
			data: { type: "user", user: loc },
		},
		class: "fileedit",
		builder: function(dom, data, ui) {
			if (data === null)
				dom.text("<no file>");
		}
	};
};

var makeFileEditor = function(dom, file, onClose) {
	var data = Maggi({
		mark_removed: function() {
			data.close();
			file.removed = true;
		},
		close: function() {
			removeOverlay();
			if (onClose) onClose();
		},
		data: file,
		upload: null
	});
	var validfile = function(file) {
		return file.name !== "";
	};
	var ui = Maggi({
		type: "object",
		class: "popup",
		children: {
			title: { type: "label", label: "File Settings" },
			data: fileeditui,
			close: { type: "function", class: "right button blue", label: "Done", enabled: false },
			upload: { type: "user", user: fileinput },
			mark_removed: { type: "function", class: "left button orange", label: "Mark as Removed" }
		},
		builder: function(dom, data, ui) {
			data.bind("set", "upload", function(k, v) {
				var d = data.data;
				d.name = v.name;
				d.type = v.mimeType;
				d.enc = v.enc;
				d.data = v.data;
				d.cursor = { row: 0, column: 0 };
			});
			var validate = function(k) {
				if (k == "data" || k[0] == "data")
					ui.children.close.enabled = validfile(data.data);
			};
			data.bind("set", "data", validate);
			data.bind("set", validate);
			validate("data");
		}
	});
	var removeOverlay = Maggi.UI.overlay(dom, data, ui);
};

var fileinput = function(dom, data, setdata, ui) {
	m = Maggi.UI_devel(dom);

	m.data = {
		select: function() { dom.ui.i._Maggi.click(); },
		i: "",
	};

	m.ui = {
		children: {
			i: { type: "input", kind: "file", visible: false },
			select: { type: "function", label: "Import Local File", class: "button" },
		},
		builder: function(dom) {
			dom.ui.i.change(function(evt) {
				var f = evt.target.files[0];
				var reader = new FileReader();
				var texttypes = [
					"application/javascript",
					"text/html",
					"text/css",
					"text/plain",
					"text/markdown",
					"image/svg+xml",
					"application/json"
				];
				var text = (texttypes.indexOf(f.type) >= 0);
				if (!text) {
					reader.onload = function(e) {
						var d = reader.result;
						var idx1 = d.indexOf(";");
						var idx2 = d.indexOf(",");
						var enc = d.substring(idx1 + 1, idx2);
						var data = d.substring(idx2 + 1);
						setdata({
							name: f.name,
							mimeType: f.type,
							size: f.size,
							enc: enc,
							data: data
						});
					};
					reader.readAsDataURL(f);
				} else {
					reader.onload = function(e) {
						setdata({
							name: f.name,
							mimeType: f.type,
							size: f.size,
							enc: "utf8",
							data: reader.result
						});
					};
					reader.readAsText(f);
				}
			});
		}
	};
};
