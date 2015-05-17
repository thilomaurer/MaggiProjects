var pwcalc=function(dom) {
	var data=Maggi({
		alias:"",
		secret:"",
		password:""
	});

	data.bind("set",["alias","secret"],function(k,v) {
		data.password=calcPassword(data.alias,data.secret);
	});

	var calcPassword = function(alias,secret) {
		if (secret===""||alias==="") return "";
		var array = Sha1.hash(secret + alias).match(/.{1,2}/g);
		for (var i in array) array[i] = parseInt(array[i], 16);
		return btoa(String.fromCharCode.apply(null, array));
	};

	var ui=Maggi({
		type:"object",
		children: {
			header: {type:"label", label:"Password Calculator"},
			alias:  {type:"input", placeholder:"alias"},
			secret: {type:"input", placeholder:"secret", kind:"password"},
			password: "text"
		}
	});

	Maggi.UI($('body'),data,ui);
};

main=pwcalc;
