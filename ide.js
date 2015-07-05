var prj = function(dom,prjdata,setdata,oui,datachange) {

	var data=Maggi({
		project: prjdata,
		panes: {},
		view: prjdata.view
	});

	var ui = function() {
		return {
			type:"object",
			children:{
				project: projectui,
				view: {
					type:"object",
					children:{ 
						panes:panesui(prjdata)
					},
					builder:function(dom,data,ui) {
						var rev=data.revision;
						ui.files=prjdata.revisions[rev].files;
					}
				}
			},
			class:"prj tablerows"
		};
	};
	ui=ui();

	return Maggi.UI(dom,data,ui);
}

var panesui = function(prjdata) {
	var panes=null;
	return {
		wrapchildren:true,
		wrap:true,
		class:"tablecolumns",
		childdefault:{
			type:"user",
			user:function(dom,data,setdata,ui,onDataChange) {
				var u=paneui();
				var d=panedata();
				var rem=function(i) {
					dom.parent().addClass("closepane");
					setTimeout(function() {
						panes.remove(i);
					},200);
				};
				var ins=function(i) {
					i=parseInt(i);
					var p=prjdata.view.panes;
					var n=Object.keys(p).length;
					p.add(n,{fileid:null,mode:"edit"});
				};
				d.bind("closepane",function(k,v) {
					for (var i in panes) if (panes[i]===data) rem(i);
				});
				d.bind("insertpane",function(k,v) {
					for (var i in panes) if (panes[i]===data) ins(i);
				});
	
				var build=function(data) {
					var rev=prjdata.view.revision;
					d.files=prjdata.revisions[rev].files;
					d.mode=data.mode;
					d.file=d.files[data.fileid];
				};
				build(data);
				onDataChange(build);
				dom.parent().addClass("closepane");
				setTimeout(function() { 
					dom.parent().removeClass("closepane");
				},0);
				return Maggi.UI(dom,d,u);
			}
		},
		builder:function(dom,data,ui) {
			panes=data;
			prjdata.bind("add",function(k,v) {
				console.log(k);
			});
			data.bind("add",function(k,v) {
				console.log(k);
			});
		}
	}
}

var ide = function(dom,data,setdata,oui,datachange) {
	
	if (data==null) data=Maggi({projects: {}});

	var ui = {
		children: {
			projects: {
				type:"list",
				childdefault:{type:"user",user:prj},
				select:"single",
				selected:null,
			}
		},
		class:"ide mui-light"
	};
	Maggi.UI(dom,data,ui);
	return {data:data,ui:ui};
}
