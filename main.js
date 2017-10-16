
var main=function(m) {

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
		[
			["package.json","demos/empty/project.json"],
			["main.js","demos/empty/main.js"],
			["index.html","demos/empty/index.html"],
		],
		function(project) {
			project.view.panes.add(0,{fileid:0,mode:"edit"});
			project.view.panes.add(1,{fileid:1,mode:"edit"});
			project.view.panes.add(2,{fileid:1,mode:"preview"});
			project.view.panes.order=["0","1","2"];
			project.checkout.branch="master";
			project.checkout.id="00000000000";
			complete(project);
		}
	);
};

sampleprojects.pwcalc=function(complete) {
	initproject(
		{name:"Thilo Maurer",email:"tm@thilomaurer.de",username:"thilomaurer"},
		[
			["package.json","demos/pwcalc/project.json"],
			["README.md","demos/pwcalc/README.md"],
			["index.html","demos/pwcalc/index.html"],
			["pwcalc.js","demos/pwcalc/pwcalc.js"],
			["pwcalc.css","demos/pwcalc/pwcalc.css"],
			["utils.js","demos/pwcalc/utils.js"],
			["lock.svg","demos/pwcalc/lock.svg"]
		],
		function(project) {
			project.view.panes.add(0,{fileid:1,mode:"edit"});
			project.view.panes.add(1,{fileid:3,mode:"edit"});
			project.view.panes.add(2,{fileid:4,mode:"edit"});
			project.view.panes.add(3,{fileid:3,mode:"preview"});
			project.view.panes.order=["0","1","2","3"];
			complete(project);
		}
	);
};

