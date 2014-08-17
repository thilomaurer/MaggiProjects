Maggi.UI.editor=function(dom,data,setdata,ui) {
	var editor=dom._Maggi;
	if (!editor) {
		Maggi.UI.BaseFunctionality(dom,ui);
		
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
		Maggi.UI(dom,d,fmt);

		fmt.children.annot.bind(function(k,v) {
			if (k=="selected") { 
				var annot=d.annot[v];
				data.file.cursor={row:annot.row, column:annot.column};
			}
		});
		
		editor = ace.edit(dom.ui.editor[0]);

		function updateMode() {
			var type=data.file.type;
			var mode="text";
			if (type=="js") mode="javascript";
			if (type=="css") mode="css";
			if (type=="html") mode="html";
			editor.getSession().setMode("ace/mode/"+mode);
		}

		data.bind(function(k,v) {
			if (k=="file") updateMode();
			if (k[0]=="file"&&k[1]=="type") updateMode();
		});
		editor.setTheme("ace/theme/xcode");
		updateMode();
		editor.on("change", function(e) {
			if (!dom._MaggiDisableEvents) data.file.data=editor.getValue();
		});
		editor.getSession().selection.on('changeCursor', function() {
			if (!dom._MaggiDisableEvents) data.file.cursor=editor.getCursorPosition();
		});
		editor.getSession().on("changeAnnotation", function() {
			d.annot = editor.getSession().getAnnotations();
		});	
		dom._Maggi=editor;
		dom._MaggiDisableEvents=false; //hack to work around ACE issue.
	};
	var updateText = function() {
		if (editor.getValue()==data.file.data) return;
		dom._MaggiDisableEvents=true; //hack to work around ACE issue.
		editor.setValue(data.file.data);
		dom._MaggiDisableEvents=false;
	};
	var updateCursor = function() {
		var op=editor.getCursorPosition();
		var c=data.file.cursor;
		if ((c.row==op.row)&&(c.column==op.column)) return;
		dom._MaggiDisableEvents=true; //hack to work around ACE issue.
		editor.selection.setSelectionRange({start:c,end:c},false);
		//editor.centerSelection();
		dom._MaggiDisableEvents=false;
	};
	data.bind(function(k,v) {
		if (k=="file") { updateText(); updateCursor(); }
		if (k[0]=="file"&&k[1]=="data") updateText();
		if (k[0]=="file"&&k[1]=="cursor") updateCursor();
	});
	updateText();
	updateCursor();
};
