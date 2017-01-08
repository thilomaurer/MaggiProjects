
var main=function() {
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
			console.warn("disconnect");
			m.ui.children.connecting.visible=true;
		},
		reconnect: function() {
			console.warn("reconnect");
			m.ui.children.connecting.visible=false;
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
	
	m.data=Maggi.db.client("Maggi.UI.IDE",events,m.data);
};

var sampleprojects={};

sampleprojects.Maggi=function(complete) {
	initproject(
		{name:"<nobody>",username:"username",email:"user@localhost"},
		{
            name:"New Empty Project",
            author:null,
            icon:null,
            deps: [
                "node_modules/jquery/dist/jquery.js",
                "node_modules/socket.io/node_modules/socket.io-client/socket.io.js",
                "node_modules/headjs/dist/1.0.0/head.load.js",
                "node_modules/Maggi.js/node_modules/sprintf-js/src/sprintf.js",
                "node_modules/Maggi.js/Maggi.js",
                "node_modules/Maggi.js/Maggi.UI.js",
                "node_modules/Maggi.js/Maggi.UI.css",
                "main.js"
            ]
		},
		[
			["main.js","demos/main.js"],
		],
		function(project) {
			project.view.panes.add(0,{fileid:0,mode:"edit"});
			project.view.panes.add(1,{fileid:1,mode:"edit"});
			project.view.panes.add(2,{fileid:1,mode:"preview"});
			project.view.panes.order=["0","1","2"];
			complete(project);
		}
	);
};

sampleprojects.pwcalc=function(complete) {
	initproject(
		{name:"Thilo Maurer",email:"tm@thilomaurer.de",username:"thilomaurer"},
		{
            name:"Password Calculator",
		    author:"Thilo Maurer, www.thilomaurer.de",
		    icon:"lock.svg",
            deps: [
                "node_modules/jquery/dist/jquery.js",
                "node_modules/socket.io/node_modules/socket.io-client/socket.io.js",
                "node_modules/headjs/dist/1.0.0/head.load.js",
                "node_modules/Maggi.js/node_modules/sprintf-js/src/sprintf.js",
                "node_modules/Maggi.js/Maggi.js",
                "node_modules/Maggi.js/Maggi.UI.js",
                "node_modules/Maggi.js/Maggi.UI.css",
                "utils.js",
                "pwcalc.js","pwcalc.css",
            ]
		},
		[
			["README.txt","demos/README.txt"],
			["pwcalc.js","demos/pwcalc.js"],
			["pwcalc.css","demos/pwcalc.css"],
			["pwcalc.html","demos/pwcalc.html"],
			["utils.js","demos/utils.js"],
			["lock.svg","demos/lock.svg"]
		],
		function(project) {
			project.view.panes.add(0,{fileid:2,mode:"edit"});
			project.view.panes.add(1,{fileid:3,mode:"edit"});
			project.view.panes.add(2,{fileid:2,mode:"preview"});
			project.view.panes.order=["0","1","2"];
			complete(project);
		}
	);
};

