var filedata=function(o) {
	var fd={name:null,type:null,enc:null,data:null,cursor:{row:0,column:0}};
	$.extend(fd,o);
	return Maggi(fd);
};

var fileui=function() {
	var ui=listitemui();
	ui.children.details={type:"label", class:"icon ion-ios-more"};
	ui.editvisible=false;
	ui=Maggi(ui);
	ui.builder=function(dom,data,ui) {
		var repairfile=function(data) {
			var bp=filedata();
			for (var k in bp) {
				if (data!=null) if (data[k]==null) data.add(k,bp[k]);
			}
		};
		repairfile(data);
		var click=function() {
			ui.editvisible=true;
			return false;
		};
		ui.children.details.add("onClick",click);
	};
	return ui;
};

var fileeditui=function() {

	var loc = function(dom,data,setdata,ui,datachange) {
		var text="empty file";
		if (data!==null)
			text=data.length+" characters, " + data.split("\n").length + " lines";
		dom.text(text);
	};

	return {
		children:{
			type: {type:"select",choices:{
				"application/javascript":{label:"JS"},
				"text/html":{label:"HTML"},
				"text/css":{label:"CSS"},
				"text/plain":{label:"TXT"},
				"image/svg+xml":{label:"SVG"},
				"application/json":{label:"JSON"}
			},class:"fillhorizontal"},
			name: {type:"input",placeholder:"filename"},
			cursor: {
				children: {
					label:{type:"label",label:"cursor position: line "},
					row:"text",
					label2:{type:"label",label:", column "},
					column:"text"
				}
			},
			data:{type:"user",user:loc},
		},
		class:"fileedit",
		builder:function(dom,data,ui) {
			if (data===null) 
				dom.text("<no file>");
		}
	};
};

var makeFileEditor=function(dom,file,setfile,onRemove,onClose) {
	var data=Maggi({
		delete:function() { 
			data.close();
			onRemove();
		},
		close:function() { 
			removeOverlay();
			if (onClose) onClose();
		},
		data:file,
		upload:null
	});
	var validfile=function(file) {
		return file.name!=="";
	};
	var ui=Maggi({
		type:"object",
		class:"popup",
		children: {
			//title:{type:"label", label:"File Settings"},
			data:fileeditui,
			close:{type:"function",class:"right button",label:"Done",enabled:false},
			upload:{type:"user",user:fileinput},
			delete:{type:"function",class:"left button red",label:"Delete File"},
		},
		builder: function(dom,data,ui) {
            dom.parent().addClass("mui-light");
            data.bind("set","upload",function(k,v) {
                    data.data={name:v.name,type:v.mimeType,enc:v.enc,data:v.data,cursor:{row:0,column:0}};
                    setfile(data.data);
            });
            var validate=function(k) {
                    if (k=="data"||k[0]=="data")
                            ui.children.close.enabled=validfile(data.data);
            };
            data.bind("set","data",validate);
            data.bind("set",validate);
            validate("data");
		}
	});
	var removeOverlay=Maggi.UI.overlay(dom,data,ui);
};

var fileinput=function(dom,data,setdata,ui) {
    m=Maggi.UI_devel(dom);

	m.data={
		select:function() {dom.ui.i._Maggi.click();},
		i:"",
	};
	
	m.ui={
		children: {
			i: {type:"input", kind:"file", visible:false},
			select: {type:"function", label:"Upload File", class:"button"},
		},
		builder: function(dom) {
            dom.ui.i.change(function(evt) {
                var f=evt.target.files[0];
                var reader = new FileReader();
                var texttypes=[
                    "application/javascript",
                    "text/html",
                    "text/css",
                    "text/plain",
                    "image/svg+xml",
                    "application/json"
                ];
                var text=(texttypes.indexOf(f.type)>=0);
                if (!text) {
                    reader.onload = function(e) {
                        var d=reader.result;
            		    var idx1=d.indexOf(";");
            		    var idx2=d.indexOf(",");
            		    var enc=d.substring(idx1+1,idx2);
            		    var data=d.substring(idx2+1);
                        setdata({
                            name:f.name,
                            mimeType:f.type,
                            size:f.size,
                            enc:enc,
                            data:data
                        });
                    };
                    reader.readAsDataURL(f);
                } else {
                    reader.onload = function(e) {
                        setdata({
                            name:f.name,
                            mimeType:f.type,
                            size:f.size,
                            enc:"utf8",
                            data:reader.result
                        });
                    };
                    reader.readAsText(f);
                }
		    });
		}
	};
};

var file=function(m,dom) {
    m.data=filedata({name:"test.name",type:"text/css"});
    m.ui=fileui();
    m.ui.add("enabled",true);
    m.ui.enabled=false;
    m.ui.class="mui-light";
    
};
