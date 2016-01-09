var panes=function(m,dom) {
	sampleprojects.pwcalc(function(project) {
		m.data=project.view.panes;
		m.ui=panesui(project);
		dom.addClass("mui-light expand");
	});
};

var panesui = function(prjdata) {
	var panes=null;
	return {
		class:"panes cols flexanimate",
		order:{},
		childdefault:{
			type:"user",
			user:function(dom,data,setdata,ui,onDataChange) {
				var u=paneui();
				var d=panedata();
				var rem=function(i) {
					dom.addClass("closing");
					setTimeout(function() {
						panes.order=orderRemove(panes.order,i);
						panes.remove(i);
					},200);
				};
				var ins=function(i) {
					var k=parseInt(i)+1;
					while (panes[k]!=null) k+=1;
					k=k.toString();
					panes.add(k,{fileid:panes[i].fileid,mode:"edit"});
					panes.order=orderInsert(panes.order,i,k);
				};
				d.bind("closepane",function(k,v) {
					for (var i in panes) if (panes[i]===data) rem(i);
				});
				d.bind("insertpane",function(k,v) {
					for (var i in panes) if (panes[i]===data) ins(i);
				});
				var build=function(data) {
					u.children.edit.settings=prjdata.options.editor;
					var revid=prjdata.view.revision;
					var rev=prjdata.revisions[revid];
					d.files=rev.files;
					d.readonly=rev.committed;
					d.addfile=projectfuncs(prjdata).addfile;
					//ui.addfile.enabled=!v; 
					if (data!=null) {
						d.mode=data.mode;
						u.children.header.children.files.selected=data.fileid;
					}
					d.bind("set","mode",function(k,v) {data.mode=v;});
					rev.bind("set","committed",function(k,v) {
					    d.readonly=v; 
					    /*ui.addfile.enabled=!v;*/
					    
					});
					u.children.header.children.files.bind("set","selected",function(k,v) {data.fileid=v;});
				};
				build(data);
				prjdata.view.bind("set","revision",function(k,v) {
					build(data);
				});
				onDataChange(build);
				dom.addClass("closing");
				setTimeout(function() { 
					dom.removeClass("closing");
				},0);
				return Maggi.UI(dom,d,u);
			}
		},
		builder:function(dom,data,ui) {
			panes=data;
			data.bind("set","order",function(k,v) {ui.order=v;});
			ui.order=data.order;
		}
	};
};