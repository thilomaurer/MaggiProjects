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
		db=JSON.parse(db);
	} catch(e) {
		db={data:{},rev:1};
	}
	db=Maggi(db);
	db.bind("set","rev",function() {
		writefile(dbfp, JSON.stringify(db), enc);
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

var db=Maggi.db("data",true);
Maggi.sync.log=true;


var writefile=function(fp,data,enc) {
	var saving=false;
	var save_again=false;
	var save=function() {
		save_again=saving;
		if (saving) return;
		saving=true;
		var dir=fp.substring(0,fp.lastIndexOf("/"));
		console.log(fp);
		var done=function(err) {
			saving=false;
			if (err) console.log(JSON.stringify(err));
			if (save_again) save();
		};
		mkdirp(dir,function(err) {
			if (err) done(err);
			else fs.writeFile(fp, data, enc, done);
		}); 
	};
	save();
}

/*
db.data.projects.bind(["set","add"],function(k,v) {
	if (k.length==6&&k[5]=="data"&&k[1]=="revisions"&&k[3]=="files") {
		var p=k[0];
		var r=k[2];
		var f=k[4];
		var project=db.data.projects[p];
		var revision=project.revisions[r];
		var file=revision.files[f];
		var fp=__dirname + "/project/" + revision.name + "/" +file.name;
		var enc="utf8";
		writefile(fp, v, enc);
	}
});
*/
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};


function projectsHttpHandler(req,res) {
	var fn=decodeURIComponent(req.url);
	var k=fn.split("/"); k.shift();
	console.log(JSON.stringify(k));
	var prjname=k.shift();
	//console.log(prjid);
	var prjs=db.data.projects;
	var prj=null;
	for (var prjid in prjs) {
		var prj=prjs[prjid];
		var revid=prj.view.revision;
		var rev=prj.revisions[revid];
		if (rev.name==prjname) {
			var files=rev.files;
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
	res.writeHead(500);
	return res.end('Error loading '+req.url);
}


io.sockets.on('connection', function(socket) {
	console.log("connected "+socket.id);
	allconnections.push(socket);
	Maggi.serve(socket,db);
});

console.log("Maggi.UI IDE Server localhost:"+port);
app.listen(port);
