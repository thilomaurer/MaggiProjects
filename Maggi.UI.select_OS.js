Maggi.UI.select_OS=function(dom,data,setdata,ui,onDataChange) {
	var unbase=Maggi.UI.BaseFunctionality(dom,data,setdata,ui,onDataChange);

	dom._Maggi={};
	var sel=$("<select>").appendTo(dom);
	$.each(ui.choices,function(key,value) {
		$("<option>",{value:key,text:value.label}).appendTo(sel);
	});
	sel[0].value=data;
	sel.change(function() {	
		setdata(sel[0].value); 
	});

	onDataChange(function(data) {
		sel[0].value=data;
	});

	var backbuild_builder=null;
	if (ui.builder) backbuild_builder=ui.builder(dom,data,ui); //must be last in build

	return function() {
		if (backbuild_builder) { backbuild_builder(); backbuild_builder=null; }
		unbase();
	};

};
