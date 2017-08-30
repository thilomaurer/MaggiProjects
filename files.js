var filesui=function() { 
	var ui=listui();
	ui.orderkey="name";
	ui.childdefault=fileui;
	var oldbuilder=ui.builder;
	ui.builder=function(dom,data,ui) {
		oldbuilder(dom,data,ui);
		ui.children.bind("add",function(k,v) {
			if (k[1]=="delete_item"&&v===true) {
				k=k[0];
				data.remove(k); 
			}
		});
		
	};
	return ui;
};

var files=function(m,dom) {
    m.data={
        a:filedata({name:"file-C",type:"text/plain"}),
        b:filedata({name:"file-B",type:"text/javascript"}),
        c:filedata({name:"file-A",type:"text/html",removed:true}),
    };
    m.ui=filesui();
    m.ui.class+=" tablelist";
    m.ui.children.b.add("enabled",true);
    m.ui.children.b.enabled=false;
    $('html').addClass("mui-light");
};
