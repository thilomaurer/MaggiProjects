var prj = function(dom,prjdata,setdata,oui,datachange) {

	var data=Maggi({
		project: prjdata,
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
			class:"prj tablerows expand"
		};
	};
	ui=ui();

	return Maggi.UI(dom,data,ui);
};

var panesui = function(prjdata) {
	var panes=null;
	return {
		wrapchildren:true,
		wrap:true,
		class:"tablecolumns expand",
		order:{},
		childdefault:{
			type:"user",
			user:function(dom,data,setdata,ui,onDataChange) {
				var u=paneui();
				var d=panedata();
				var rem=function(i) {
					dom.parent().addClass("closepane");
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
					var rev=prjdata.view.revision;
					d.files=prjdata.revisions[rev].files;
					d.addfile=projectfuncs(prjdata).addfile;
					if (data!=null) {
						d.mode=data.mode;
						u.children.header.children.files.selected=data.fileid;
					}
					d.bind("set","mode",function(k,v) {data.mode=v;});
					u.children.header.children.files.bind("set","selected",function(k,v) {data.fileid=v;});
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
			data.bind("set","order",function(k,v) {ui.order=v;});
			ui.order=data.order;
		}
	};
};

var ide = function(dom,data,setdata,oui,datachange) {
	
	if (data==null) data=Maggi({projects: {}});

	var ui = {
		children: {
			projects: {
			    wrapchildren:true,
			    class:"tablerows expand",
				//type:"list",
				childdefault:{type:"user",user:prj},
				select:"single",
				selected:null,
			}
		},
		class:"ide mui-light"
	};
	Maggi.UI(dom,data,ui);
	return {data:data,ui:ui};
};


var orderRemove=function(o,k) {
	var order=toArray(o);
	order.splice(order.indexOf(k),1);
	return order;
};

var orderInsert=function(o,k,i) {
	var order=toArray(o);
	order.splice(order.indexOf(k)+1,0,i);
	return order;
};

var toArray = function(o) {
	return Object.keys(o).sort().map(function(k) { return o[k]; });
};
