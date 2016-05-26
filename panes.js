var panes=function(m,dom) {
	sampleprojects.pwcalc(function(project) {
		m.data=project.view.panes;
		m.ui=panesui(project);
		dom.addClass("mui-light expand");
	});
};

var panesui = function(prjdata) {
	var panes=null;
	var panesdom=null;
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
					panes.add(k,{fileid:panes[i].fileid,mode:"edit",showcontrols:true});
					panes.order=orderInsert(panes.order,i,k);
					var idom=panesdom.ui[k];
                    idom.addClass("closing");
                    setTimeout(function() { 
                        idom.removeClass("closing");
                    },0);
				};
				d.bind("closepane",function(k,v) {
					for (var i in panes) if (panes[i]===data) rem(i);
				});
				d.bind("insertpane",function(k,v) {
					for (var i in panes) if (panes[i]===data) ins(i);
				});
				var backbuild=null;
				var build=function(data) {
				    if (backbuild) backbuild();
					u.children.edit.settings=prjdata.options.editor;
					var revid=prjdata.view.revision;
					var rev=prjdata.revisions[revid];
					d.files=rev.files;
                    var setcommitted=function(k,v) {
					    d.readonly=v; 
                        if (v==true) d.addfile=null; else d.addfile=projectfuncs(prjdata).addfile;
                    };
					if (data!=null) {
						d.mode=data.mode;
						d.showheader=data.showheader;
						u.children.header.children.files.selected=data.fileid;
					}
					var handlers=[
					    [u.children.header.children.files,"set","selected",function(k,v) {data.fileid=v;}],
					    [rev,"set","committed",setcommitted],
					    [d,"set","mode",function(k,v) {data.mode=v;}],
					];
					backbuild=installBindings(handlers);
				};
				build(data);
				prjdata.view.bind("set","revision",function(k,v) {
					build(data);
				});
				onDataChange(build);
				return Maggi.UI(dom,d,u);
			}
		},
		builder:function(dom,data,ui) {
		    panesdom=dom;
			panes=data;
			var setorder=function(k,v) {ui.order=v;};
			if (data) {
			    data.bind("set","order",setorder);
			    ui.order=data.order;
			}
			return function() {
			    if (data) data.unbind("set",setorder);
			};
		}
	};
};