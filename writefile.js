var fs = require('fs'),
    mkdirp = require('mkdirp'),
    write_s = {};

var writefile=function(fp,data,enc) {
	if (enc==null) enc="utf8";
	if (write_s[fp]==null) 
		write_s[fp]={fp:fp,data:data,enc:enc,saving:false,save_again:false};
	else { write_s[fp].data=data; write_s[fp].enc=enc; write_s[fp].save_again=true; }

	var save=function(x) {
		var dir=x.fp.substring(0,x.fp.lastIndexOf("/"));
		x.save_again=x.saving;
		if (x.saving) return;
		x.saving=true;
		var done=function(err) {
			x.saving=false;
			if (err) console.log(JSON.stringify(err));
			if (x.save_again) save(x);
		};
		mkdirp(dir,function(err) {
			if (err) done(err);
			else {
				var d=x.data;
				if (typeof d === "function") d=d();
				fs.writeFile(x.fp, d, x.enc, done);
			}
		}); 
	};
	save(write_s[fp]);
};

module.exports = writefile;