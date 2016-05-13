
var main = function() {
	var dom=$('body');
	var m=Maggi.UI_devel(dom);
	ide_init(m);

	var ddd=new Date();
	var events={
	    ready: function() {
    		console.log("Time to ready in ms:",(new Date()).getTime()-ddd.getTime());
    		m.ui.children.connecting.visible=false;
	    },
	    disconnect: function() {
		    m.ui.children.connecting.visible=true;
	    }
	};

	m.data=Maggi.db.client("Maggi.UI.IDE",events,m.data);
};

var sampleprojects={};

sampleprojects.Maggi=function(complete) {
	initproject(
		{name:"<nobody>",username:"username",email:"username@domain.com"},
		{name:"New Empty Project"},
		[
			"jquery.js",
			"socket.io.js",
			["sprintf.js","Maggi.js-0.2/sprintf.js"],
			["Maggi.js/Maggi.js","Maggi.js-0.2/Maggi.js"],
			["Maggi.js/Maggi.UI.js","Maggi.js-0.2/Maggi.UI.js"],
			["Maggi.js/Maggi.UI.css","Maggi.js-0.2/Maggi.UI.css"],
			["main.js","demos/main.js"],
		],
		function(project) {
			project.view.panes.add(0,{fileid:7,mode:"edit"});
			project.view.panes.add(1,{fileid:7,mode:"preview"});
			project.view.panes.order=["0","1"];
			complete(project);
		}
	);
};

sampleprojects.pwcalc=function(complete) {
	initproject(
		{name:"Thilo Maurer",email:"tm@thilomaurer.de",username:"thilomaurer"},
		{name:"Password Calculator",icon:"lock.svg"},
		[
			"jquery.js",
			"socket.io.js",
			["sprintf.js","Maggi.js-0.2/sprintf.js"],
			["Maggi.js/Maggi.js","Maggi.js-0.2/Maggi.js"],
			["Maggi.js/Maggi.UI.js","Maggi.js-0.2/Maggi.UI.js"],
			["Maggi.js/Maggi.UI.css","Maggi.js-0.2/Maggi.UI.css"],
			["README.txt","demos/README.txt"],
			["pwcalc.js","demos/pwcalc.js"],
			["pwcalc.css","demos/pwcalc.css"],
			["pwcalc.html","demos/pwcalc.html"],
			["utils.js","demos/utils.js"],
			["lock.svg","demos/lock.svg"]
		],
		function(project) {
			project.view.panes.add(0,{fileid:8,mode:"edit"});
			project.view.panes.add(1,{fileid:9,mode:"edit"});
			project.view.panes.add(2,{fileid:8,mode:"preview"});
			project.view.panes.order=["0","1","2"];
			complete(project);
		}
	);
};

