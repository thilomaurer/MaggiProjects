var prj=function(m,dom) {
    sampleprojects.pwcalc(function(project) {
        m.data=project;
        m.ui=prjui;
        dom.addClass("mui-light expand");
	});
};

var prjui={
    type:"user",
    user:function(dom,prjdata,setdata,oui,datachange) {
    	var data=Maggi({
    		project: prjdata,
    		view: prjdata.view
    	});
    
    	var ui = Maggi({
    		children:{
    			project: projectui,
    			view: {
    				children:{ 
    					panes:panesui(prjdata)
    				},
    				builder:function(dom,data,ui) {
    					var rev=data.revision;
    					ui.files=prjdata.revisions[rev].files;
    				},
    				class:"rows"
    			}
    		},
    		class:"prj rows",
    		builder:function(dom,data,ui) {
            	ui.children.project.bind("set","state",function(k,v) {
            	    dom.addClass("closing");
            	});
		
    		}
    	});
    	
    	oui.bind(["set","add"],"state",function(k,v) {
        	var vis=(v=="open");
    	    ui.children.view.add("visible",vis);
    	});
    
    	return Maggi.UI(dom,data,ui);
    }
};
