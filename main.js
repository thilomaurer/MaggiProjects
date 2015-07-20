
var main = function() {
	//Maggi.log=true;
	var hostname = window.location.host.split(":")[0];
	var socket = io.connect('http://'+hostname);
	var m=ide($('body'));
	Maggi.client(socket,m.data);
	$('body').keypress(function() {
		initproject("Thilo Maurer","username@domain","Password Calculator",[
			"jquery-2.0.3.js",
			"Maggi.js",
			"Maggi.UI.js",
			"Maggi.UI.css",
			"Maggi.UI.input.css",
			"Maggi.UI.select.css",
			"demos/pwcalc.js",
			"demos/pwcalc.css",
			"demos/pwcalc.html",
			"demos/utils.js"],
			function(project) {
				project.view.panes[0].fileid=6;
				project.view.panes[1].fileid=7;
				project.view.panes[2].fileid=6;
				if (m.data.projects[0]==null) {
					m.data.projects.add(0,project);
					m.ui.children.projects.selected=0;
				}
			}
		);
	});
}
