var filesui = function() {
	var ui = listui();
	ui.orderkey = "name";
	ui.childdefault = fileui;
	var oldbuilder = ui.builder;
	ui.builder = function(dom, data, ui) {
		oldbuilder(dom, data, ui);
		ui.children.bind("add", function(k, v) {
			if (k[1] == "delete_item" && v === true) {
				k = k[0];
				data.remove(k);
			}
		});

	};
	return ui;
};

var files = function(m, dom) {
	m.data = files.exampledata();
	m.ui = filesui();
	m.ui.class += " tablelist";
	m.ui.children.b.add("enabled", true);
	m.ui.children.b.enabled = false;
	$('html').addClass("mui-light");
};

files.exampledata = function() {
	var files = {
		"0": filedata({ name: "file.css", type: "text/css", data: "y { margin:0 }", cursor: { row: 100, column: 0 } }),
		"1": filedata({ name: "file.js", type: "text/javascript", data: "var x=function(a,b,c,d) { a=1; b=2; };" }),
		"2": filedata({ name: "file.html", type: "text/html", data: "<HTML><BODY>fsdfsdf</BODY></HTML>" }),
		"3": filedata({ name: "file.md", type: "text/markdown", data: "**bold** *italic*\n" }),
		"4": filedata({ name: "file.json", type: "application/json", data: '{ "a":1,\n"b":2}\n', removed: true }),
		"6": filedata({ name: "file2.md", type: "text/markdown", data: "**bold** test *italic*\n" }),
	};
	return files;
};
