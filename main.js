
var main = function() {
	//Maggi.log=true;
	var hostname = window.location.host.split(":")[0];
	var socket = io.connect('http://'+hostname);
	var m=ide($('body'));
	Maggi.client(socket,m.data);
	$('body').keypress(function(e) {
		var c=e.keyCode;
		if (c==67) {
		    sampleprojects.pwcalc(function(project) {
				if (m.data.projects[0]==null) {
					m.data.projects.add(0,project);
					m.ui.children.projects.selected=0;
				}
			});
		}
		if (c==32) {
		    sampleprojects.Maggi(function(project) {
				if (m.data.projects[0]==null) {
					m.data.projects.add(0,project);
					m.data.projects.add(1,project);
					m.ui.children.projects.selected="0";
				}
			});
		}
	});
};


var sampleprojects={};

sampleprojects.Maggi=function(complete) {
	initproject("User","username@domain","New Empty Project",[
		"jquery-2.0.3.js",
		"Maggi.js",
		"Maggi.UI.js",
		"Maggi.UI.css",
		"Maggi.UI.input.css",
		"Maggi.UI.select.css"],
		function(project) {
			project.view.panes.add(0,{fileid:0,mode:"edit"});
			project.view.panes.order=["0"];
			complete(project);
		}
	);
};

sampleprojects.pwcalc=function(complete) {
	initproject("Thilo Maurer","tm@thilomaurer.de","Password Calculator",
		[
			["README.txt","demos/README.txt"],
			"jquery-2.0.3.js",
			"Maggi.js",
			"Maggi.UI.js",
			"Maggi.UI.css",
			"Maggi.UI.input.css",
			"Maggi.UI.select.css",
			["pwcalc.js","demos/pwcalc.js"],
			["pwcalc.css","demos/pwcalc.css"],
			["pwcalc.html","demos/pwcalc.html"],
			["utils.js","demos/utils.js"]
		],
		function(project) {
			project.view.panes.add(0,{fileid:7,mode:"edit"});
			project.view.panes.add(1,{fileid:8,mode:"edit"});
			project.view.panes.add(2,{fileid:7,mode:"preview"});
			project.view.panes.order=["0","1","2"];
			complete(project);
		}
	);
};

            





