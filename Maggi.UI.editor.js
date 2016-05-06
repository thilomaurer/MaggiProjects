Maggi.UI.editor=function(dom,data,setdata,outer_ui,onDataChange) {
	
	var builder=function(dom,d,ui) {
		//console.log(outer_ui.settings);
		var annotsethandler=function(k,v) {
			if (k=="selected") { 
				var annot=d.annot[v];
				data.file.cursor={row:annot.row, column:annot.column};
			}
		};
		
		var editor=ace.edit(dom.ui.doc[0]);
		editor.$blockScrolling = Infinity;
		editor.setTheme("ace/theme/xcode");
		var disableEvents=false; //hack to work around ACE issue.

		function updateMode() {
			var mode="text";
			if (data.file) {
				var type=data.file.type;
				if (type=="text/javascript") mode="javascript";
				if (type=="application/javascript") mode="javascript";
				if (type=="text/css") mode="css";
				if (type=="text/html") mode="html";
				if (type=="image/svg+xml") mode="svg";
				if (type=="application/json") mode="json";
			}
			editor.getSession().setMode("ace/mode/"+mode);
		}

		editor.on("change", function(e) {
			if (!disableEvents) data.file.data=editor.getValue();
		});
		editor.getSession().selection.on('changeCursor', function() {
			if (!disableEvents) data.file.cursor=editor.getCursorPosition();
		});
		editor.getSession().on("changeAnnotation", function() {
			d.annot = editor.getSession().getAnnotations();
		});	

		var updateText = function() {
			var text=null;
			if (data.file) {
				text=data.file.data;
				if (editor.getValue()==text) return;
			}
			disableEvents=true; //hack to work around ACE issue.
			if (text==null) text="";
			editor.session.setValue(text);
			disableEvents=false;
		};
		var updateCursor = function() {
			if (data.file==null) return;
			var op=editor.getCursorPosition();
			var c=data.file.cursor;
			if ((c.row==op.row)&&(c.column==op.column)) return;
			disableEvents=true; //hack to work around ACE issue.
			editor.selection.setSelectionRange({start:c,end:c},false);
			editor.centerSelection();
			disableEvents=false;
		};
		var updateFile = function() {
			var file=data.file;
			editor.setReadOnly(file==null);
			updateText();
			updateMode();
			updateCursor();
		};
		var sethandler=function(k,v) {
			if (k=="file") updateFile(); 
			if (k[0]=="file"&&k[1]=="type") updateMode();
			if (k[0]=="file"&&k[1]=="data") updateText();
			if (k[0]=="file"&&k[1]=="cursor") updateCursor();
		};
		var ouihandler=function(k,v) {
			if (k=="readonly") editor.setReadOnly(v);
			//if (k=="settings"||k[0]=="settings") editor.setOptions(outer_ui.settings);
			if (k[0]=="settings") {
				var opt={};
				if (k[2]=="keyboard") {
					var modes={
						gui:"",
						vim:"ace/keyboard/vim",
						emacs:"ace/keyboard/emacs"
					};
					editor.setKeyboardHandler(modes[v]);
				} else {
					opt[k[2]]=v;
					editor.setOptions(opt);
				}
			}
		};
		data.bind(sethandler);
		outer_ui.bind(ouihandler);
		fmt.children.annot.bind(annotsethandler);
		updateFile();
		ouihandler("readonly",outer_ui.readonly);
		ouihandler("settings",outer_ui.settings);
		if (outer_ui.settings) ouihandler(["settings","keyboard"],outer_ui.settings.keyboard);
		return function() {
			data.unbind(sethandler);
			outer_ui.unbind(ouihandler);
			fmt.children.annot.unbind(annotsethandler);
			editor.destroy();
		};
	};
	
	var d=Maggi({editor:"",annot:{}});
	var fmt=Maggi({
		children: {
			doc:{},
			annot:{
				wrap:true,
				type:"list",
				childdefault:{
					childdefault:"text",
					order:["type","row","column","text"],
					builder:function(dom,data) {
						dom.addClass(data.type);
					}
				},
				select:"single",
				selected:null, 
				class:"scroll"
			}
		},
		builder:builder,
		class:"editor flexrows"
	});
	return Maggi.UI(dom,d,fmt);
};
