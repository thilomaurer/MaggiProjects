var panes = function(m, dom) {
	project.samples.pwcalc(function(project) {
		m.data = project.view.panes;
		m.ui = panesui(project);
		dom.addClass("expand");
	});
	$("html").addClass("mui");
};

var panesui = function(prjdata) {
	var panes = null;
	var panesdom = null;
	return {
		class: "panes cols flexanimate",
		order: {},
		childdefault: {
			type: "user",
			user: function(dom, data, setdata, ui, onDataChange) {
				var u = paneui();
				var d = panedata();
				var rem = function(i) {
					dom.addClass("closing");
					setTimeout(function() {
						panes.order = orderRemove(panes.order, i);
						panes.remove(i);
					}, 200);
				};
				var ins = function(i) {
					var k = parseInt(i) + 1;
					while (panes[k] != null) k += 1;
					k = k.toString();
					panes.add(k, { filename: panes[i].filename, mode: "edit", showcontrols: true });
					panes.order = orderInsert(panes.order, i, k);
					var idom = panesdom.ui[k];
					idom.addClass("closing");
					setTimeout(function() {
						idom.removeClass("closing");
					}, 0);
				};
				d.bind("closepane", function(k, v) {
					for (var i in panes)
						if (panes[i] === data) rem(i);
				});
				d.bind("insertpane", function(k, v) {
					for (var i in panes)
						if (panes[i] === data) ins(i);
				});
				var backbuild = null;
				var build = function(data) {
					if (backbuild) backbuild();
					u.children.edit.settings = prjdata.options.editor;
					d.files = prjdata.files;
					var setid = function(k, v) {
						var ro = (v != null);
						d.readonly = ro;
						if (ro == true) d.addfile = null;
						else d.addfile = prjdata.addfile;
					};
					if (data != null) {
						d.filename = data.filename;
						d.mode = data.mode;
						d.showheader = data.showheader;
					}
					var handlers = [
						[prjdata.checkedout, "set", "id", setid],
						[d, "set", "mode", function(k, v) { if (data) data.mode = v; }],
						[d, "set", "filename", function(k, v) { if (data) data.filename = v; }],
						[prjdata, "set", "files", function(k, v) { d.files = v; }],
						[prjdata, "set", "id", function(k, v) { u.projectid = v; }]
					];
					backbuild = installBindings(handlers);
				};
				build(data);
				onDataChange(build);
				return Maggi.UI(dom, d, u);
			}
		},
		builder: function(dom, data, ui) {
			panesdom = dom;
			panes = data;
			var setorder = function(k, v) { ui.order = v; };
			if (data) {
				data.bind("set", "order", setorder);
				ui.order = data.order;
			}
			return function() {
				if (data) data.unbind("set", setorder);
			};
		}
	};
};
