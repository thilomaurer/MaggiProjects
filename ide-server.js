var app = require('http').createServer(httpHandler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    mime = require('mime'),
    Maggi = require('Maggi.js'),
    mkdirp = require('mkdirp'),
    port = process.argv[2] || 8000,
    log = {HTTP:false};

function httpHandler(req, res) {
	var fn=req.url;
	if (log.HTTP) console.log("GET " + fn);
	var dir="projects";
	if (fn.indexOf("/"+dir+"/")==0) {
		req.url=req.url.substring(dir.length+1);
		return projectsHttpHandler(req,res);
	}
	if (fn.indexOf("/proxy?")==0) {
		req.url=req.url.substring(1);
		return proxyHttpHandler(req,res);
	}
	if (fn=="/") fn="/index.html";
	var fp=__dirname + fn;
	fs.readFile(fp, function(err, data) {
		if (err) {
			console.log(err);
			res.writeHead(500);
			return res.end('Error loading '+req.url);
		}
		res.writeHead(200, {"Content-Type": mime.lookup(fn)});
		res.end(data);
	});
}

var allconnections=[];

Maggi.db=function(dbname,bindfs) {
	var db;
	var dbfp=__dirname + "/" + dbname;
	var dbdir=dbfp + ".fs/";
	var enc="utf8";
	try {
		db=fs.readFileSync(dbfp, enc);
	} catch(e) {
	    console.log("Initializing new Maggi.db '"+dbname+"'");
	    db='{"data":{},"rev":1}';
	}
	try {
		db=JSON.parse(db);
	} catch(e) {
		console.log("Error parsing Maggi.db '"+dbname+"': "+e);
		process.exit(1);
	}
	var stringify=function() { return JSON.stringify(db, null, '\t'); };
	db=Maggi(db);
	db.bind("set","rev",function() {
		writefile(dbfp, stringify, enc);
		//writefile(dbfp+"."+db.rev, JSON.stringify(db, null, '\t'), enc);
	});

	var saveFS=function(k,v) {
		if (v instanceof Object) {
			for (var k1 in v) 
				saveFS(k.concat(k1),v[k1]);
			return;
		}
		if (k instanceof Array) k=k.join("/");
		var fp=dbdir+k;
		writefile(fp,v,enc);
	};

	
	if (bindfs) db.bind("set",saveFS);
	return db;
};

var db=Maggi.db("data",false);
Maggi.sync.log=true;

var write_s={}

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

var exportRevision=function(revision) {
        var childwithkv = function(o,key,name) {
                for (var k in o)
                        if (name==o[k][key]) return o[k];
                return null;
        };
        var k=childwithkv(revision.files,"name","project.json");
        var d=null;
        try {
                d=JSON.parse(k.data);
        } catch(e) {
                console.log(e);
        }
        if (d==null) return;
        var revname=d.name;

        for (var k in revision.files) {
                var file=revision.files[k];
                var fp=__dirname + "/project/" + revname + "/" +file.name;
                writefile(fp, file.data, file.enc);
        }
};

db.bind(["set","add"],function(k,v) {
	if (
		k.length==8&&
		k[0]=="data"&&
		k[1]=="projects"&&
		k[3]=="revisions"&&
		k[5]=="files"&&
		k[7]=="data"
	) {
		var p=k[2];
		var r=k[4];
		var f=k[6];
		var project=db.data.projects[p];
		var revision=project.revisions[r];
		exportRevision(revision);
	}
});

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function proxyHttpHandler(client_req,client_res) {
	var url = require('url');

	var url_parts = url.parse(client_req.url, true);
	var options = url.parse(url_parts.query.url,true);
	console.log("PROXYING: "+url_parts.query.url);
	//console.log(JSON.stringify(options));
	var http;
	if (options.protocol=="http:") {
		http = require('http');
	}
	if (options.protocol=="https:") {
		http = require('https');
	}
	var proxy = http.request(options, function (res) {
		//console.log('STATUS: ' + res.statusCode);
		//console.log('HEADERS: ' + JSON.stringify(res.headers));
		res.pipe(client_res, { end: true });
	});

	client_req.pipe(proxy, { end: true });

}

function projectsHttpHandler(req,res) {
	var fn=decodeURIComponent(req.url);
	var k=fn.split("/"); k.shift();
	console.log(JSON.stringify(k));
	var prjname=k.shift();
	var prjs=db.data.projects;
	var prj=null;
	for (var prjid in prjs) {
		var prj=prjs[prjid];
		var revid=prj.view.revision;
		var rev=prj.revisions[revid];
		var files=rev.files;
		var prjfile=files[0];
		var projectname=null;
		if (prjfile.name=="project.json") {
			var project=JSON.parse(prjfile.data);
			projectname=project.name;
		}
		if (projectname==prjname) {
			if (k[k.length-1]=="") k[k.length-1]="index.html";
			var fn=k.join("/");
			for (var k in files) {
				var file=files[k];
				if (file.name==fn) {
					res.writeHead(200, {"Content-Type": file.type});
					res.end(file.data);
					return;
				}
			}

		}
	}
	res.writeHead(404);
	return res.end('Error loading '+req.url);
}

io.sockets.on('connection', function(socket) {
	console.log("connected "+socket.id);
	allconnections.push(socket);
	Maggi.serve(socket,db);
});

console.log("Maggi.UI IDE Server localhost:"+port);
app.listen(port);
