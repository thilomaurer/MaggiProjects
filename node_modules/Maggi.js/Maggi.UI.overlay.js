Maggi.UI.overlay=function(dom,data,ui,setdata,ondatachange) {
	var int_data=Maggi({content:data});
	var int_ui=Maggi({
		type:"object",
		visible:false,
		children:{
			content: ui
		},
		class:"overlay visibilityanimate"
	});
	dom.addClass("overlayed allanimate");
	var int_div=$("<div>").insertAfter(dom);
	var backbuild=Maggi.UI(int_div,int_data,int_ui);
	setTimeout(function() {
		int_ui.visible=true;
	},0);
	return function() {
		dom.removeClass("overlayed");
		int_ui.visible=false;
		setTimeout(function() {
			backbuild();
			int_div.remove();
		},200);
	};
}
