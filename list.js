var listui=function() { 
	var emptylabel=$("<div>",{id:"emptylabel",text:"no entries"})
	return { 
		type:"list",
		childdefault:listitemui,
		select:"single",
		selected:null,
		class:"tablelist selectable tablegrid expand-hrz",
		order:null,
		orderkey:null,
		builder:function(dom,data,ui) {
			var empty=(data==null)||(Object.keys(data).length===0);
			if (empty) dom.append(emptylabel); else emptylabel.remove();
			var order=function() {
				var o=null;
				var ok=ui.orderkey;
				if (ok!=null)
				o=Object.keys(data).sort(function(a,b) {
					var da=data[a];
					var db=data[b];
					if (da==null) return false;
					if (db==null) return true;
					da=da[ok];
					db=db[ok];
					if (da==null) return false;
					if (db==null) return true;
					return da.localeCompare(db);
				});
				ui.order=o;
			};
			ui.bind("set","orderkey",order);
			order();
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
				"application/javascript":"icons/js.svg",
				"text/html":"icons/html5.svg",
				"text/css":"icons/css3.svg",
				"text/plain":"icons/text.svg",
				"text/markdown":"icons/markdown.svg"
			}},
			name: {type:"text"},
		},
		class:"listitem",
		builder(dom,data,ui) {
		    if (data&&data.type.indexOf("class:")===0) {
		        var c=data.type.substring(6);
		        dom.ui.type.addClass(c);
		    }
		}
	};
};

var list=function(m,dom) {
	m.data={
		a:{type:"text",name:"item badass"},
		b:{type:"text/html",name:"item b"},
		c:{type:"text/html",name:"item Bad"},
	};
	m.ui=listui();
	m.ui.orderkey="name";
	//m.ui.order=["b","a"];
	//m.ui.class="mui";
};
