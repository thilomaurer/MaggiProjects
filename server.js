#!/usr/bin/env node

process.title = "MaggiProjects";

var http = require('http'),
	https = require('https'),
	zlib = require('zlib'),
	fs = require('fs'),
	pem = require('pem'),
	mime = require('mime'),
	Maggi = require('Maggi.js'),
	mkdirp = require('mkdirp'),
	git = require('nodegit'),
	url = require('url'),
	writefile = require('Maggi.js/writefile.js'),
	keyfile = "key.pem",
	certfile = "cert.pem",
	app, redirapp, io, dbs, db,
	dbname = "Maggi.UI.IDE",
	secureport = process.argv[2] || 8443,
	port = 8080,
	log = { HTTP: false, proxy: false },
	serverURL = "https://localhost:" + secureport,
	parent_node_modules = fs.existsSync(__dirname + "/../../node_modules");


function httpHandler(req, res) {
	if (log.HTTP) console.log("GET", req.url);

	var u;
	try {
		u = url.parse(req.url, true);
	} catch (e) {
		console.warn(e);
		res.writeHead(400);
		res.end('Malformatted URL: ' + req.url);
		return;
	}
	var pn = u.pathname;

	var dir = "projects";
	if (pn.indexOf("/" + dir + "/") === 0) {
		req.url = req.url.substring(dir.length + 1);
		return projectsHttpHandler(req, res);
	}
	dir = "node_modules";
	if (pn.indexOf("/" + dir + "/") === 0) {
		if (parent_node_modules)
			pn = "/../.." + pn;
	}
	if (pn == "/proxy") {
		req.url = req.url.substring(1);
		return proxyHttpHandler(req, res);
	}
	if (pn == "/") pn = "/index.html";
	var fp = __dirname + pn;
	fs.readFile(fp, function(err, data) {
		if (err) {
			console.log(err);
			res.writeHead(500);
			return res.end('Error loading ' + req.url);
		}
		res.writeHead(200, { "Content-Type": mime.lookup(pn) });
		res.end(data);
	});
}

var getRevisionManifest = function(revision) {
	var childwithkv = function(o, key, name) {
		for (var k in o)
			if (name == o[k][key]) return o[k];
		return null;
	};

	var k = childwithkv(revision.files, "name", "package.json");
	var d = null;
	try {
		d = JSON.parse(k.data);
	} catch (e) {
		console.log(e);
	}
	return d;
};

var exportRevision = function(revision) {
	var d = getRevisionManifest(revision);
	if (d === null) return;
	var revname = d.name;
	if (revname === "") {
		console.warn("unable to export project revision with empty name");
		return;
	}
	for (var k in revision.files) {
		var file = revision.files[k];
		var fp = __dirname + "/projects/" + revname + "/" + file.name;
		writefile(fp, file.data, file.enc);
	}
};

var git_read_history = function(repo, project) {
	repo.getMasterCommit().then(function(firstCommitOnMaster) {
		var history = firstCommitOnMaster.history(git.Revwalk.SORT.Time);
		var commits = [];
		history.on("commit", function(commit) {
			var c = {
				id: commit.sha(),
				author: commit.author().name() + " <" + commit.author().email() + ">",
				date: new Date(commit.date()).getTime(),
				message: commit.message(),
				parent_ids: commit.parents().toString(),
				committed: true
			};
			commits.push(c);
		});
		history.on("end", function() {
			project.history = commits;
		});
		history.start();
	});
	var type = git.Reference.TYPE.SYMBOLIC;
	repo.getReferenceNames(type).then(function(arrayString) {
		console.log(arrayString);
	});
};

var git_import_commit = function(commit) {

	var getFile = function(e) {
		var mime = {
			js: "application/javascript",
			html: "text/html",
			css: "text/css",
			txt: "text/plain",
			md: "text/markdown",
			json: "application/json",
			svg: "image/svg+xml"
		};
		if (e.isBlob()) {
			return e.getBlob().then(function(blob) {
					var enc = blob.isBinary() && "base64" || "utf8";
					var extension = e.name().split(".").pop();
					return {
						name: e.path(),
						type: mime[extension],
						enc: enc,
						data: blob.content().toString(enc),
						cursor: { row: 0, column: 0 },
						removed: false
					};
				})
				.catch(function(error) {
					console.error(error);
				});
		}
		if (e.isTree()) {
			return e.getTree().then(getDirectory);
		}
		console.log("unknown entry: " + e.path());
		return null;
	};
	var flatten = arrays => [].concat.apply([], arrays);
	var getDirectory = tree => Promise.all(tree.entries().map(getFile));


	var project = projectdata();
	var rev = project.revisions[0];
	project.revisions.remove(0);

	//project.checkout.branch = branch;
	project.checkout.id = commit.sha();

	rev.message = commit.message();
	rev.committer = commit.committer().name();
	rev.completed = commit.committer().when().time() * 1000;
	rev.committed = true;
	rev.revision = commit.sha();
	rev.parentrevision = commit.parents().toString();
	return commit.getTree()
		.then(getDirectory)
		.then(function(files) {
			files = flatten(files);
			rev.files = files;
			project.freefileid = files.length;
			project.revisions.add(rev.revision, rev);
			projectfuncs(project).branch(rev)();
			var fileid = files.findIndex(f => f.name.match(/readme\.md/i)) || 0;
			var panes = project.view.panes;
			panes.add(0, { fileid: fileid, mode: "edit" });
			panes.add(1, { fileid: fileid, mode: "preview" });
			panes.order = ["0", "1"];
			return project;
		});
}


var git_clone = function(options, project_handle) {
	var url = options.url;
	var branch = options.branch;
	var dir = "projects/" + project_handle + ".git";
	console.log("Adding project via git clone from branch " + branch + " of repo " + url);

	var repo;
	return git.Clone(url, dir, { checkoutBranch: branch })
		.then(function(r) {
			repo = r;
			//repo.setIdent(options.user.name, options.user.email);
			return repo.getHeadCommit();
		})
		.then(git_import_commit)
		.then(function(project) {
			git_read_history(repo, project);
			return project;
		})
		.catch(function(error) {
			console.error(error);
		});
};

var git_checkout = function(options, project_handle) {
	var id = options.id;
	var branch = options.branch;
	var dir = "projects/" + project_handle + ".git";
	console.log("Loading project via git checkout from branch " + branch + " of commit " + id);

	return git.Repository.open(dir)
		.then(function(r) {
			repo = r;
			//repo.setIdent(options.user.name, options.user.email);
			return repo.getCommit(id);
		})
		.then(git_import_commit)
		.then(function(project) {
			git_read_history(repo, project);
			return project;
		})
		.catch(function(error) {
			console.error(error);
		});
};


var revision = function() {
	var data = Maggi({
		revision: 0,
		started: new Date(),
		completed: null,
		committer: null,
		committed: false,
		parentrevision: null,
		message: null,
		files: []
	});
	return data;
};

var projectdata = function(o) {
	var data = Maggi({
		revisions: {
			0: revision()
		},
		freefileid: 0,
		view: {
			revision: 0,
			panes: {
				order: {}
			}
		},
		commands: {},
		checkout: {
			branch: "master",
			id: "00000"
		},
		history: {

		},
		addfile: function(file) {
			file = filedata(file);
			var fileid = data.freefileid++;
			var revid = data.view.revision;
			data.revisions[revid].files.add(fileid, file);
			return fileid;
		},
		options: {
			colorscheme: "auto",
			user: {
				username: null,
				name: null,
				email: null,
			},
			editor: {
				colorscheme: {
					day: "maggiui",
					night: "maggiui"
				},
				gutter: {
					showGutter: true,
					fixedWidthGutter: true,
					highlightGutterLine: true,
					showLineNumbers: true,
				},
				ui: {
					animatedScroll: false,
					hScrollBarAlwaysVisible: false,
					vScrollBarAlwaysVisible: false,
					showPrintMargin: false,
					printMarginColumn: 80,
					fadeFoldWidgets: false,
					showFoldWidgets: true,
					scrollPastEnd: true,
					highlightActiveLine: true,
					highlightSelectedWord: true,
				},
				editing: {
					showInvisibles: false,
					displayIndentGuides: true,
					useSoftTabs: false,
					tabSize: 4,
					cursorStyle: "ace",
					selectionStyle: "line",
					keyboard: "gui"
				}
			}
		}
	});
	if (o) Maggi.merge(data, o);
	return data;
};

var projectfuncs = function(data) {
	var project = {
		addfile: function(file) {
			file = filedata(file);
			var fileid = data.freefileid++;
			var revid = data.view.revision;
			data.revisions[revid].files.add(fileid, file);
			return fileid;
		},
		branch: function(rev) {
			return function() {
				if (rev == null) return;
				var newid = Object.keys(data.revisions).length;
				var newrev = revision();
				newrev.revision = newid;
				newrev.parentrevision = rev.revision;
				newrev.files = JSON.parse(JSON.stringify(rev.files));
				data.revisions.add(newid, newrev);
				data.view.revision = newid;
				return newid;
			};
		},
		commit: function(rev) {
			return function() {
				if (rev == null) return;
				if (rev.committed) { alert("Error: Revision " + id + " already committed earlier."); return; }
				rev.completed = new Date();
				rev.committer = data.options.user.username;
				rev.committed = true;
			};
		}
	};
	return project;
};


var run_project = function(project, p) {

	var exec_command = function(cmd) {
		if (cmd == null) return;
		if (cmd.command == "git_clone")
			git_clone(cmd.parameters, p).then(function(project) {
				db.data.projects[p] = project;
			});
		if (cmd.command == "git_checkout")
			git_checkout(cmd.parameters, p).then(function(project) {
				db.data.projects[p] = project;
			});
	};

	var cmds, cmd;
	cmds = project.commands;
	if (cmds) cmd = cmds[0];
	if (cmd) exec_command(cmd);
	
	project.commands.bind("add", function(k, v) {
		exec_command(v);
	});
}

var dbchangehandler = function(k, v) {
	if (
		k.length == 8 &&
		k[0] == "data" &&
		k[1] == "projects" &&
		k[3] == "revisions" &&
		k[5] == "files" &&
		k[7] == "data"
	) {
		var p = k[2];
		var r = k[4];
		var f = k[6];
		var project = db.data.projects[p];
		var revision = project.revisions[r];
		exportRevision(revision);
	}
	if (
		k.length == 3 &&
		k[0] == "data" &&
		k[1] == "projects"
	) {
		var p = k[2];
		var project = db.data.projects[p];
		run_project(project, p);
	}
};

var proxyCounter = 0;
var proxyInProgress = 0;

function proxyHttpHandler(client_req, client_res) {

	var url_parts, options;
	try {
		url_parts = url.parse(client_req.url, true);
		options = url.parse(url_parts.query.url, true);
	} catch (e) {
		console.warn(e);
		client_res.writeHead(400);
		client_res.end('Malformatted URL: ' + client_req.url);
		return;
	}
	proxyCounter += 1;
	proxyInProgress += 1;
	var pc = proxyCounter;
	if (log.proxy) console.log("PROXY", pc, url_parts.query.url);
	var httpx = null;
	if (options.protocol == "http:") httpx = http;
	if (options.protocol == "https:") httpx = https;
	if (httpx === null) {
		client_res.writeHead(400);
		client_res.end('Malformatted URL: ' + client_req.url);
		return;
	}

	//var acceptEncoding = client_req.headers['accept-encoding']||'';
	var start = new Date().getTime();
	options.method = client_req.method;
	options.headers = {};
	var fields = ['content-type', 'content-length', 'connection', 'accept', 'accept-encoding', 'accept-language', 'cookie', 'user-agent'];
	for (var i in fields) {
		var k = fields[i];
		if (client_req.headers[k] != null) options.headers[k] = client_req.headers[k];
	};
	var scs = url_parts.query.setcookiesearch;
	var scr = url_parts.query.setcookiereplace;
	var origin = url_parts.query.origin;
	var host = url_parts.query.host;
	if (origin != null) options.headers.origin = origin;
	if (host != null) options.headers.host = host;
	if (log.proxy) {
		console.log('PROXY CLIENT_REQ_HEADERS', client_req.headers);
		console.log('PROXY PROXY_REQ', options);
	}
	var req = httpx.request(options, function(res) {
		proxyInProgress -= 1;
		var end = new Date().getTime();
		if (log.proxy) {
			console.log("PROXY", pc, { msec: end - start, outstanding: proxyInProgress });
			console.log('PROXY RES STATUS', res.statusCode);
			console.log('PROXY RES HEADERS', res.headers);
		}
		if ((scs != null) && (scr != null)) {
			var sci = res.headers['set-cookie'];
			if (sci != null) {
				for (var i = 0; i < sci.length; i++) {
					sci[i] = sci[i].replace(new RegExp(scs), scr);
				}
			}
		}
		if (res.headers.location != null) {
			var query = {
				url: res.headers.location
			};
			if (scs != null) query.setcookiesearch = scs;
			if (scr != null) query.setcookiereplace = scr;
			var querystring = "";
			for (var k in query) {
				if (querystring.length != 0) querystring += "&";
				querystring += k + "=" + encodeURIComponent(query[k]);
			}
			res.headers.location = "/proxy?" + querystring;
		}
		client_res.writeHead(res.statusCode, res.headers);
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
	req.on('error', function(err) {
		console.warn(err);
		client_res.writeHead(400);
		client_res.end('Proxy Error');
	});

	client_req.pipe(req, { end: true });
}

function projectsHttpHandler(req, res) {

	var u;
	try {
		u = url.parse(req.url, true);
	} catch (e) {
		console.warn(e);
		res.writeHead(400);
		res.end('Malformatted URL: ' + req.url);
		return;
	}
	var k = decodeURI(u.pathname).split("/");
	k.shift();
	var prjname = k.shift();
	var prjs = db.data.projects;
	for (var prjid in prjs) {
		var prj = prjs[prjid];
		var revid = prj.view.revision;
		var rev = prj.revisions[revid];
		var project = getRevisionManifest(rev);
		if (project === null) continue;
		if (project.name == prjname) {
			if (k[0] == "node_modules") {
				var redir = "/";
				if (parent_node_modules)
					redir = "/../../";
				var fp = __dirname + redir + k.join("/");
				fs.readFile(fp, function(err, data) {
					if (err) {
						console.log(err);
						res.writeHead(500);
						return res.end('Error loading ' + req.url);
					}
					res.writeHead(200, { "Content-Type": mime.lookup(fp) });
					res.end(data);
				});
				return;
			}
			if (k[k.length - 1] == "") k[k.length - 1] = "index.html";
			var fn = k.join("/");
			var files = rev.files;
			for (var kk in files) {
				var file = files[kk];
				if (file.name == fn) {
					res.writeHead(200, { "Content-Type": file.type });
					res.end(file.data, file.enc);
					return;
				}
			}
		}
	}
	res.writeHead(404);
	return res.end('Error loading ' + req.url);
}

function redirectHandler(req, res) {
	res.writeHead(301, { Location: serverURL });
	res.end();
}

var load_certificates = () => new Promise((resolve, reject) => {
	var res = (key, cert) => resolve({ key, cert });
	if (fs.existsSync(keyfile) && fs.existsSync(certfile)) {
		res(fs.readFileSync(keyfile), fs.readFileSync(certfile));
	} else {
		pem.createCertificate({ days: 365, selfSigned: true }, function(err, keys) {
			if (err)
				return reject(err);
			else {
				fs.writeFileSync(keyfile, keys.serviceKey);
				fs.writeFileSync(certfile, keys.certificate);
				console.log("SSL key pair created and saved.");
				res(keys.serviceKey, keys.certificate);
			}
		});
	}
});

var start = function(options) {
	app = https.createServer(options, httpHandler);
	redirapp = http.createServer(redirectHandler);
	io = require('socket.io').listen(app);
	dbs = Maggi.db.server(io, dbname);
	db = dbs[dbname];
	db.bind("set", dbchangehandler);
	db.bind("add", dbchangehandler);
	app.listen(secureport);
	redirapp.listen(port);
	console.log("Maggi Projects Server " + serverURL);
}

load_certificates().then(start);
