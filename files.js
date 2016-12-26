var filesui=function() { 
	var ui=listui();
	ui.childdefault=fileui;
	ui.builder=function(dom,data,ui) {
		ui.children.bind("set",function(k,v) {
			if (k[1]=="editvisible"&&v===true) {
				k=k[0];
				makeFileEditor($('body'),data[k],function(newdata) {
					data[k]=newdata;
				},function() { 
					data.remove(k); 
				},function() { 
					ui.children[k].editvisible=false; 
				});
			}
		});
	};
	return ui;
};

var files=function(m,dom) {
    m.data={
            a:filedata({name:"file-A",type:"text/plain"}),
            b:filedata({name:"file-B",type:"text/javascript"}),
            c:filedata({name:"file-C",type:"text/html"}),
    };
    m.ui=filesui();
    m.ui.class+=" tablelist";
    m.ui.children.b.add("enabled",true);
    m.ui.children.b.enabled=false;
    $('html').addClass("mui-light");
};
