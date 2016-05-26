var panedata=function() {
	var files=Maggi({});
	var f={name:"<unnamed>",type:"text",data:"",cursor:{row:0,column:0}};
	var p=Maggi({
		file:f,
		files:files,
		addfile:null,
		mode:"edit",
		readonly:false,
		showcontrols:true,
		edit:{file:f},
		actions: {},
		preview: {
			detach: false,
			reload:0,
			file: null,
			files: files
		}
	});
	p.bind(function(k,v) {
		if (k=="files") p.preview.files=v;
	});
	p.actions.add("closepane",function() {
		p.trigger("closepane");
	});
	p.actions.add("insertpane",function() {
		p.trigger("insertpane");
	});
	return p;
};

var buildFilesEdit = function(dom,data,ui) {
	var int_data=Maggi({
		files:data,
		actions:{
			adder:{type:"plus",name:"Add File..."}
		},
	});
	var int_ui={
		visible:false,
		children: {
			actions:listui(),
			filesLabel:{type:"label",label:"FILES", class:"listlabel"},
			files: filesui(),
		},
		builder:function(dom,int_data,int_ui) {
            int_ui.children.actions.children.adder.add("enabled",true);
            int_ui.children.actions.children.adder.enabled=false;
            ui.add("addfile",null);

			var setaddfile=function(k,v) {
			    int_ui.children.actions.children.adder.enabled=(v!=null);
			};
			var setselectedaction=function(k,v) {
				if (v=="adder") {
					var filekey=ui.addfile({name:""});
					int_ui.children.files.children[filekey].editvisible=true;
				}
				int_ui.children.actions.selected=null;
			};
			var setselectedfile=function(k,v) {
				var openfile = function(file) {
					if (file.type!="directory") {
						ui.selected=v;
						ui.visible=false;
					}
				};
				if (v!=null) openfile(v);
			};
			var handlers=[
			    [ui,"set","addfile",setaddfile],
			    [int_ui.children.actions,"set","selected",setselectedaction],
			    [int_ui.children.files,"set","selected",setselectedfile]
			];
			return installBindings(handlers);
		}
	};
	return Maggi.UI(dom,int_data,int_ui);
};

var paneuiheader = function() {
    return Maggi({
        visible:true,
		children:{
			file:listitemui,
			files:{
				popup:true,
				popuptrigger:"file",
				order:[],
				builder:buildFilesEdit,
				selected:null,
				class:"scroll"
			},
			//mode:{type:"select",choices:{edit:{label:"edit"},preview:{label:"preview"}},visible:true},
			play:{type:"label",class:"play icon"},
			options:{type:"label",class:"options icon"},
			actions: {
				popup:true, popuptrigger:"options",
				children: {
					closepane:{type:"function",label:"close pane", class:"button red"},
					insertpane:{type:"function",label:"insert pane", class:"button"},
				}
			},
			editor_actions:{data:{},children:{}},
			preview_actions:{
				data:{},
				children:{
				    reload:{type:"label",class:"reload icon"},
					detach:{type:"label",class:"detach icon"}
				}
			},
			spacer:{type:"label"}
		},
		order: ["file","files","mode","spacer","play","editor_actions","preview_actions","options","actions"],
		class:"paneheader",
		builder:function(dom,data,ui) {
			if (data==null) return;
			var setaddfile=function(k,v) {
			    ui.children.files.addfile=data.addfile;
			};
			var updateFile=function() {
				var v=ui.children.files.selected;
				data.file=data.files[v];
			};
			dom.ui.actions.ui.closepane.click(function() {
				ui.children.actions.visible=false;
			});
			dom.ui.actions.ui.insertpane.click(function() {
				ui.children.actions.visible=false;
			});
			dom.ui.play.click(function() {
			    var m="edit";
			    if (data.mode==m) m="preview";
				data.mode=m;
			});
			dom.ui.preview_actions.ui.detach.click(function() {
				data.preview.detach=!data.preview.detach;
			});
			dom.ui.preview_actions.ui.reload.click(function() {
				data.preview.reload+=1;
			});
			var updateMode = function(k,v) {
				var p=(v=="preview");
				var e=(v=="edit");
				ui.children.editor_actions.add("visible",e);
				ui.children.preview_actions.add("visible",p);
				if (p) { 
					var dc=ui.children.preview_actions.children.detach;
					data.preview.bind("set","detach",function(k,v) {
						if (v) dc.class="detach icon activated"; else dc.class="detach icon";
					});
				}
				var dp=ui.children.play;
				if (p) dp.class="play icon activated"; else dp.class="play icon";
			};
			var updateModeVis = function(k,v) {
				//ui.children.mode.visible=(v.type=="text/javascript");
			};
			var updateRO = function(k,v) {
				var editlabel="edit";
				if (v==true) editlabel="view";
				ui.children.mode={type:"select",choices:{edit:{label:editlabel},preview:{label:"preview"}},visible:true};
			};
			var handlers=[
				[data,"set", "mode", updateMode],
				[ui.children.files,"set","selected",updateFile],
				[data,"set","files",updateFile],
				[data,"set","file",updateModeVis],
				[data,"set","readonly",updateRO],
				[data,"set","addfile",setaddfile]
			];
			return installBindings(handlers);
		}
	});
};

var installBindings=function(handlers) {
	$.each(handlers,function(idx,v) {
		var o=v[0];
		var e=v[1];
		var k=v[2];
		var f=v[3];
		if (o!=null) {
			o.bind(e,k,f);
			f(k,o[k]);
		} else console.log("bind to null ignored");
	});
	return function() {
		$.each(handlers,function(idx,v) {
			var o=v[0];
			var e=v[1];
			var k=v[2];
			var f=v[3];
			if (o!=null) {
				o.unbind(e,f); //TODO: (e,k,f);
			} else console.log("unbind from null ignored");
		});
	};
};

var paneui = function() {
	return {
		children:{
			header:paneuiheader(),
			preview:{type:"user", user:previewui, class:"flexrows"},
			edit:{type:"editor", class:"flexrows",readonly:false,settings:{}}
		},
		order:["header","edit"],
		class:"pane flexrows",
		builder: function(dom,data,ui) {
			ui.children.header.add("data",data);
			var updateMode = function(k,v) {
				ui.order=["header",v];
			};
			var updateRO = function(k,v) {
				ui.children.edit.readonly=v;
			};
			var updateSH = function(k,v) {
				ui.children.header.visible=v;
			};
			var updateFile = function(k,v) {
				data.preview.file=v;
				data.edit.file=v;
			};
			var handlers=[
				[data,"set", "file", updateFile],
				[data,"set", "mode", updateMode],
				[data,"set", "readonly", updateRO],
				[data,"set", "showcontrols", updateSH]
			];
			return installBindings(handlers);
		}
	};
};

var pane=function(m,dom) {
	m.data=panedata();
	m.data.files.add("0",filedata({name:"file.css",type:"text/css",data:"a\na\na\na\na"}));
	m.data.files.add("1",filedata({name:"file.js",type:"text/javascript",data:""}));
	m.data.files.add("2",filedata({name:"file.html",type:"text/html",data:"fsdfsdf"}));
	for (i=3;i<50;i++)
		m.data.files.add(i,filedata({name:"file"+i+".html",type:"text/html",data:"fsdfsdf"}));
	m.ui=paneui();
	m.ui.children.header.children.files.selected="0";
	dom.addClass("mui-light expand");
};


