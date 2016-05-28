#!/usr/bin/env node

process.title="MaggiProjects";

var http = require('http'),
    https = require('https'),
    app = http.createServer(httpHandler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    mime = require('mime'),
    Maggi = require('Maggi.js'),
    dbname = "Maggi.UI.IDE",
    dbs = Maggi.db.server(io,dbname),
    db = dbs[dbname],
    mkdirp = require('mkdirp'),
    port = process.argv[2] || 8000,
    log = {HTTP:false,proxy:false},
    url = require('url'),
    writefile = require('Maggi.js/writefile.js');

console.log("Maggi.UI IDE Server localhost:"+port);

function httpHandler(req, res) {
	if (log.HTTP) console.log("GET", req.url);
	
    var u;
    try {
        u = url.parse(req.url, true);
    } catch(e) {
        console.warn(e);
        res.writeHead(400);
        res.end('Malformatted URL: '+req.url);
        return;
    }
    var pn=u.pathname;

	var dir="projects";
	if (pn.indexOf("/"+dir+"/")===0) {
		req.url=req.url.substring(dir.length+1);
		return projectsHttpHandler(req,res);
	}
	if (pn=="/proxy") {
		req.url=req.url.substring(1);
		return proxyHttpHandler(req,res);
	}
	if (pn=="/") pn="/index.html";
	var fp=__dirname + pn;
	fs.readFile(fp, function(err, data) {
		if (err) {
			console.log(err);
			res.writeHead(500);
			return res.end('Error loading '+req.url);
		}
		res.writeHead(200, {"Content-Type": mime.lookup(pn)});
		res.end(data);
	});
}

var getRevisionManifest=function(revision) {
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
	return d;
};

var exportRevision=function(revision) {
        var d=getRevisionManifest(revision);
        if (d===null) return;
        var revname=d.name;
    	if (revname==="") {
    		console.warn("unable to export project revision with empty name");
    		return;
    	}
        for (k in revision.files) {
                var file=revision.files[k];
                var fp=__dirname + "/projects/" + revname + "/" +file.name;
                writefile(fp, file.data, file.enc);
        }
};

var dbchangehandler=function(k,v) {
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
};

db.bind("set",dbchangehandler);
db.bind("add",dbchangehandler);

var proxyCounter=0;
var proxyInProgress=0;
function proxyHttpHandler(client_req,client_res) {

	var url_parts,options;
	try {
		url_parts = url.parse(client_req.url, true);
		options = url.parse(url_parts.query.url,true);
	} catch(e) {
		console.warn(e);
		client_res.writeHead(400);
		client_res.end('Malformatted URL: '+client_req.url);
		return;
	}
	proxyCounter+=1;
	proxyInProgress+=1;
	var pc=proxyCounter;
	if (log.proxy) console.log("PROXYING",pc,url_parts.query.url);
	var httpx=null;
	if (options.protocol=="http:") httpx=http;
	if (options.protocol=="https:") httpx=https;
	if (httpx===null) {
		client_res.writeHead(400);
		client_res.end('Malformatted URL: '+client_req.url);
		return;
	}

	var start=new Date().getTime();
	var proxy = httpx.request(options, function (res) {
		//console.log('STATUS: ' + res.statusCode);
		//console.log('HEADERS: ' + JSON.stringify(res.headers));
		proxyInProgress-=1;
		var end=new Date().getTime();
		if (log.proxy) console.log("PROXYING",pc,"took",end-start,";",proxyInProgress,"outstanding");
		res.pipe(client_res, { end: true });
	});
	proxy.on('error', function (err) {
        console.warn(err);
        client_res.writeHead(400);
        client_res.end('Proxy Error');
	});

	client_req.pipe(proxy, { end: true });
}

function projectsHttpHandler(req,res) {
    
    var u;
    try {
        u = url.parse(req.url, true);
    } catch(e) {
        console.warn(e);
        res.writeHead(400);
        res.end('Malformatted URL: '+req.url);
        return;
    }
    console.log(u);
	var k=decodeURI(u.pathname).split("/"); k.shift();
	var prjname=k.shift();
	var prjs=db.data.projects;
	for (var prjid in prjs) {
		var prj=prjs[prjid];
		var revid=prj.view.revision;
		var rev=prj.revisions[revid];
        var project=getRevisionManifest(rev);
		if (project===null) continue;
		if (project.name==prjname) {
            if (k[0]=="node_modules") {
                var fp=__dirname + "/" + k.join("/");
                fs.readFile(fp, function(err, data) {
                    if (err) {
                        console.log(err);
                        res.writeHead(500);
                        return res.end('Error loading '+req.url);
                    }
                    res.writeHead(200, {"Content-Type": mime.lookup(fp)});
                    res.end(data);
                });
                return;
            }
			if (k[k.length-1]=="") k[k.length-1]="index.html";
			var fn=k.join("/");
            console.log(fn);
			var files=rev.files;
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

app.listen(port);
