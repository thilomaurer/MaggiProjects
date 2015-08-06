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

Maggi.db=function(dbname) {
	var db;
	var dbfp=__dirname + "/" + dbname;
	var dbdir=dbfp + ".fs";
	var enc="utf8";
	var saving={};
	var save_again={};
	var save=function() {
		save_again[dbfp]=saving[dbfp];
		if (saving[dbfp]) return;
		saving[dbfp]=true;
		fs.writeFile(dbfp, JSON.stringify(db), enc, function(err) {
			saving[dbfp]=false;
			if (err) console.log(JSON.stringify(err));
			if (save_again[dbfp]) save();
		}); 
	};
	try {
		db=fs.readFileSync(dbfp, enc);
		db=JSON.parse(db);
	} catch(e) {
		db={data:{},rev:1};
	}
	db=Maggi(db);
	db.bind("set","rev",save);

	var savefile=function(dir,fn,v) {
		var fp=dir+"/"+fn;
		if (Maggi.sync.log) console.log("writing "+fp);
		mkdirp(dir,function(err) {
			if (err) console.error("Error creating dir "+dir+", Message: " +JSON.stringify(err))
			else fs.writeFile(fp, v, enc, function(err) {
				if (err) console.log("Error writing file "+fp+", Message "+JSON.stringify(err));
			});
		});
	}

	var saveFS=function(k,v) {
		if (v instanceof Object) {
			for (var k1 in v) 
				saveFS(k.concat(k1),v[k1]);
			return;
		}
		var fn=k;
		var dir=dbdir;
		if (k instanceof Array) { 
			fn=k.pop(); 
			dir=dir+"/"+k.join("/"); 
		}
		savefile(dir,fn,v);
	};

	
	db.bind("set",saveFS);
	return db;
};

var db=Maggi.db("data");
Maggi.sync.log=true;



io.sockets.on('connection', function(socket) {
	console.log("connected "+socket.id);
	allconnections.push(socket);
	Maggi.serve(socket,db);
});

console.log("Maggi.UI IDE Server localhost:"+port);
app.listen(port);
