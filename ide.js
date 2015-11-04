var ide = function(dom,data,setdata,oui,datachange) {
	
	if (data==null) data=Maggi({projects: {}});

	var ui = {
		children: {
			projects: {
			    class:"flexrows flexpand flexanimate",
				//type:"list",
				childdefault:prjui,
				select:"single",
				selected:null,
			}
		},
		class:"ide rows mui-light"
	};
	ui=Maggi(ui);
	Maggi.UI(dom,data,ui);
	return {data:data,ui:ui};
};


var orderRemove=function(o,k) {
	var order=toArray(o);
	order.splice(order.indexOf(k),1);
	return order;
};

var orderInsert=function(o,k,i) {
	var order=toArray(o);
	order.splice(order.indexOf(k)+1,0,i);
	return order;
};

var toArray = function(o) {
	return Object.keys(o).sort().map(function(k) { return o[k]; });
};
