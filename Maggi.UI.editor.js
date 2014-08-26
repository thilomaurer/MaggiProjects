Maggi.UI.editor=function(dom,data,setdata,ui) {
	backbuild_base=Maggi.UI.BaseFunctionality(dom,ui);
	var d=Maggi({editor:"",annot:{}});
	var fmt=Maggi({
		type:"object",
		children: {
			editor:{type:"text"},
			annot:{
				type:"list",
				childdefault:{
					type:"object",
					order:["type","row","column","text"],
					builder:function(dom,data,ui) {
						dom.addClass(data.type);
					}
				},
				select:"single",
				selected:null, 
				class:"scroll"
			}
		}
	});
	var backbuild=Maggi.UI(dom,d,fmt);

	var annotsethandler=function(k,v) {
		if (k=="selected") { 
			var annot=d.annot[v];
			data.file.cursor={row:annot.row, column:annot.column};
		}
	};
	
	var editor=ace.edit(dom.ui.editor[0]);
	editor.setTheme("ace/theme/xcode");

	var disableEvents=false; //hack to work around ACE issue.

	function updateMode() {
		var mode="text";
		if (data.file) {
			var type=data.file.type;
			if (type=="js") mode="javascript";
			if (type=="css") mode="css";
			if (type=="html") mode="html";
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
			var text=data.file.data;
			if (editor.getValue()==text) return;
		}
		disableEvents=true; //hack to work around ACE issue.
		editor.setValue(text);
		disableEvents=false;
	};
	var updateCursor = function() {
		if (data.file==null) return;
		var op=editor.getCursorPosition();
		var c=data.file.cursor;
		if ((c.row==op.row)&&(c.column==op.column)) return;
		disableEvents=true; //hack to work around ACE issue.
		editor.selection.setSelectionRange({start:c,end:c},false);
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
	data.bind(sethandler);
	fmt.children.annot.bind(annotsethandler);
	updateFile();
	return function() {
		data.unbind(sethandler);
		fmt.children.annot.unbind(annotsethandler);
		editor.destroy();
		if (backbuild) backbuild();
		backbuild_base();
	}
};
