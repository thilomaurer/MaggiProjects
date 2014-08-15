function main() {
	var data=Maggi({
		header:"Password Calculator",
		alias:"",
		secret:"",
		password:""
	});

	data.bind(function(k,v) {
		if (k=="alias"||k=="secret")
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
		childdefault: {type:"text"},
		children: {
			alias: {type:"input", placeholder:"alias", class:""},
			secret: {type:"input", placeholder:"secret", class:"", kind:"password"}
		},
		builder: function(dom,data,ui) {
		var validate=function(k,v) {
		    if (k=="alias"||k=="secret")
			ui.children[k].class=(data[k]==="")?"redborder":"";
		    };
		    data.bind(validate);
		    validate("alias");
		    validate("secret");
		}
	});

	Maggi.UI($('body'),data,ui);
}
