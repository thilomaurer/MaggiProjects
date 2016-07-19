#!/usr/bin/env node

process.title="MaggiProjects";

var http = require('http'),
    https = require('https'),
    zlib = require('zlib'),
    fs = require('fs'),
    options = {
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem')
    },
    app = https.createServer(options,httpHandler),
    redirapp = http.createServer(redirectHandler),
    io = require('socket.io').listen(app),
    mime = require('mime'),
    Maggi = require('Maggi.js'),
    dbname = "Maggi.UI.IDE",
    dbs = Maggi.db.server(io,dbname),
    db = dbs[dbname],
    mkdirp = require('mkdirp'),
    secureport = process.argv[2] || 8443,
    port = 8080,
    log = {HTTP:false,proxy:true},
    url = require('url'),
    writefile = require('Maggi.js/writefile.js'),
    serverURL = "https://localhost:"+secureport;

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
	if (log.proxy) console.log("PROXY",pc,url_parts.query.url);
	var httpx=null;
	if (options.protocol=="http:") httpx=http;
	if (options.protocol=="https:") httpx=https;
	if (httpx===null) {
		client_res.writeHead(400);
		client_res.end('Malformatted URL: '+client_req.url);
		return;
	}

	//var acceptEncoding = client_req.headers['accept-encoding']||'';
	var start=new Date().getTime();
	options.method=client_req.method;
	options.headers={};
	var fields=['content-type','content-length','connection','accept','accept-encoding','accept-language','cookie','user-agent'];
	for (var i in fields) {
		var k=fields[i];
		if (client_req.headers[k]!=null) options.headers[k]=client_req.headers[k];
	};
	var scs=url_parts.query.setcookiesearch;
	var scr=url_parts.query.setcookiereplace;
	if (log.proxy) {
		console.log('PROXY REQ', options);
		console.log('PROXY CLIENT_REQ_HEADERS', client_req.headers);
	}
	var req = httpx.request(options, function (res) {
		proxyInProgress-=1;
		var end=new Date().getTime();
		if (log.proxy) {
			console.log("PROXY",pc,{msec:end-start,outstanding:proxyInProgress});
			console.log('PROXY RES STATUS', res.statusCode);
			console.log('PROXY RES HEADERS', res.headers);
		}
		if ((scs!=null)&&(scr!=null)) {
			var sci=res.headers['set-cookie'];
			for (var i=0;i<sci.length;i++) {
				sci[i]=sci[i].replace(new RegExp(scs),scr);
			}
		}
		if (res.headers.location!=null) {
			var query={
				url:res.headers.location
			};
			if (scs!=null) query.setcookiesearch=scs;
			if (scr!=null) query.setcookiereplace=scr;
			var querystring="";
			for (var k in query) {
				if (querystring.length!=0) querystring+="&";
				querystring+=k+"="+encodeURIComponent(query[k]);
			}
			res.headers.location="/proxy?"+querystring;
		}
		client_res.writeHead(res.statusCode,res.headers);
		/*
		if (acceptEncoding.match(/\bgzip\b/)) {
			client_res.writeHead(200, { 'Content-Encoding': 'gzip' });
			res=res.pipe(zlib.createGzip());
		}
		else
		if (acceptEncoding.match(/\bdeflate\b/)) {
			client_res.writeHead(200, { 'Content-Encoding': 'deflate' });
			res=res.pipe(zlib.createDeflate());
		}
		*/
		res.pipe(client_res, { end: true });
	});
	req.on('error', function (err) {
		console.warn(err);
		client_res.writeHead(400);
		client_res.end('Proxy Error');
	});

	client_req.pipe(req, { end: true });
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

function redirectHandler(req, res) {
	res.writeHead(301,{Location: serverURL});
	res.end();
}

app.listen(secureport);
redirapp.listen(port);
console.log("Maggi Projects Server "+serverURL);
