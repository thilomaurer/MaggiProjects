var pwcalc=function(m,dom) {

	m.data={
		alias:"",
		secret:"",
		len:16,
		password:"",
	};

	m.data.bind("set",[["alias"],["secret"],["len"]],function(k,v) {
		m.data.password=calcPassword(m.data);
	});

	var calcPassword = function(d) {
		if (d.secret===""||d.alias==="") return "";
		var array = Sha1.hash(d.secret + d.alias).match(/.{1,2}/g);
		for (var i in array) array[i] = parseInt(array[i], 16);
		return btoa(String.fromCharCode.apply(null, array)).substring(0,d.len);
	};

	m.ui={
	    parts:"children",
		children: {
			header: {parts:"label", label:"Password Calculator"},
			len: {parts:"select", choices:{"8":"8 chars","16":"16 chars","32":"32 chars"}},
			alias:  {parts:"input", placeholder:"alias", class:"first"},
			secret: {parts:"input", placeholder:"secret", kind:"password"},
			password: "text",
		},
		class:"pwcalc mui"
	};

};
