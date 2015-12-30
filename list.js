var listui=function() { 
	return { 
		type:"list",
		childdefault:listitemui,
		select:"single",
		selected:"",
		class:"tablelist selectable tablegrid expand-hrz",
		builder:function(dom,data,ui) {
			var empty=(data===null);
			if (empty) empty=(Object.keys(data).length===0);
			if (empty) dom.text("empty");
		}
	};
};

var listitemui=function() {
	return {
		children:{
			type: {type:"image",urls:{
				"application/json":"icons/json.svg",
				"image/svg+xml":"icons/svg.svg",
				"text/javascript":"icons/js.svg",
				"text/html":"icons/html5.svg",
				"text/css":"icons/css3.svg",
				"text":"icons/text.svg",
				plus:"icons/plus.svg"}
			},
			name: {type:"text"},
		},
		class:"listitem"
	};
};

var list=function(dom) {
	var m=Maggi.UI_devel(dom);
	m.data={lst:{a:{type:"text",name:"item a"},b:{type:"text/html",name:"item b"}}};
	m.ui={children:{lst:listui()}};
	//m.ui.class="mui";
};