#!/usr/bin/env node

process.title = "MaggiProjects";

var http = require('http'),
	https = require('https'),
	zlib = require('zlib'),
	fs = require('fs'),
	fse = require('fs-extra'),
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

Object.values || require('object.values').shim();
Object.entries || require('object.entries').shim();

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

var getProjectManifest = function(project) {
	var childwithkv = function(o, key, name) {
		for (var k in o)
			if (name == o[k][key]) return o[k];
		return null;
	};

	var k = childwithkv(project.files, "name", "package.json");
	var d = null;
	try {
		d = JSON.parse(k.data);
	} catch (e) {
		console.log(e);
	}
	return d;
};

var exportProjectFiles = function(p, ext) {
	var dir = project_path(p);
	if (ext) dir += ext;
	return Promise.all(Object.values(p.files).map(function(file) {
		if (file === null) return;
		if (file.type == "symlink") return;
		if (file.type == "submodule") return;
		var pathname = dir + "/" + file.name;
		var data = file.data || "";
		if (file.removed == true)
			return fs.existsSync(pathname) && fse.unlink(pathname);
		return fse.outputFile(pathname, data, file.enc);
	}));
};

var git_read_repo = function(repo, project) {
	var s = git_read_stashes(repo).then(function(stashes) {
		project.repo.stashes = stashes;
	});
	var r = git_read_refs(repo).then(function(refs) {
		project.repo.refs = {
			branches: refs.branches.map(r => r.sh),
			tags: refs.tags.map(r => r.sh),
			notes: refs.notes.map(r => r.sh),
		};
	});
	var h = git_read_history(repo)
		.then(function(commits) {
			var c = {
				id: null,
				author: { name: project.options.user.name, email: project.options.user.email },
				date: null,
				message: null,
				parent_ids: {},
				committed: false,
				tags: {}
			};
			commits.unshift(c);
			project.repo.history = commits;
		});
	return Promise.all([s, r, h]);
};

var git_read_stashes = function(repo, project) {
	var stashes = [];
	var stashCb = function(index, message, oid) {
		stashes.push({ index: index, message: message, id: oid.tostrS() });
	};

	return git.Stash.foreach(repo, stashCb).then(function() {
		return stashes;
	});
};

var commit_history = function(commit) {
	return new Promise((resolve, reject) => {
		var eventEmitter = commit.history(git.Revwalk.SORT.Time);
		var commits = [];
		eventEmitter.on("commit", function(c) {
			commits.push(c);
		});
		eventEmitter.on("end", function() {
			resolve(commits);
		});
		eventEmitter.on('error', reject);
		eventEmitter.start();
	});
};

var git_read_refs = function(repo) {

	var type = git.Reference.TYPE.OID;
	return repo.getReferences(type)
		.then(function(refs) {
			var refs = refs.map(function(r) {
				return {
					str: r.toString(),
					target: r.target(),
					targetid: r.target().tostrS(),
					name: r.name(),
					sh: r.shorthand(),
					isConcrete: r.isConcrete(),
					isSymbolic: r.isSymbolic(),
					isBranch: r.isBranch(),
					isTag: r.isTag(),
					isHead: r.isHead(),
					isNote: r.isNote(),
					isRemote: r.isRemote(),
					isValid: r.isValid()
				};
			});
			return {
				branches: refs.filter(r => r.isBranch),
				tags: refs.filter(r => r.isTag),
				remotes: refs.filter(r => r.isRemote),
				notes: refs.filter(r => r.isNote),
				heads: refs.filter(r => r.isHead),
				//				tagbyid: tags.reduce(function(acc, r) { acc[r.target().tostrS()] = r.shorthand(); return acc; }, {}),
			};
		});
};

var git_read_history = function(repo) {

	var type = git.Reference.TYPE.OID;
	var refs;
	return repo.getReferences(type)
		.then(function(r) {
			refs = r;
			return repo.getMasterCommit();
		})
		.then(commit_history)
		.then(function(commits) {
			return commits.map(function(commit) {
				var id = commit.sha();
				return {
					id: id,
					author: { name: commit.author().name(), email: commit.author().email() },
					date: new Date(commit.date()).getTime(),
					message: commit.message(),
					parent_ids: commit.parents().toString(),
					committed: true,
					tags: refs.filter(r => (r.target().tostrS() == id)).map(r => r.shorthand())
				};
			});
		});
};

var git_import_commit = function(commit) {

	const getFile = function(e) {
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
		if (e.isSubmodule()) {
			/*
			e.toObject(commit.repo).then(function(o) {
				console.log(o, o.url && o.url());
			});
			*/
			return {
				name: e.path(),
				type: "submodule",
				enc: null,
				data: null,
				cursor: { row: 0, column: 0 },
				removed: false
			};
		}
		if (e.filemode() == git.TreeEntry.FILEMODE.LINK) {
			if (e.type() == git.Object.TYPE.BLOB)
				return e.getBlob().then(function(blob) {
					var enc = blob.isBinary() && "base64" || "utf8";
					var data = blob.content().toString(enc);
					return {
						name: e.path(),
						type: "symlink",
						enc: enc,
						data: data,
						cursor: { row: 0, column: 0 },
						removed: false
					};
				});
		}
		var msg = "unknown entry: " + e.path();
		console.warn(msg);
		return { name: msg };
	};

	const flatten = arrays => [].concat.apply([], arrays);
	const deepflatten = array => flatten(array.map(a => a instanceof Array ? deepflatten(a) : a));
	const getDirectory = tree => Promise.all(tree.entries().map(getFile));

	return commit.getTree()
		.then(getDirectory)
		.then(deepflatten);
};


var git_clone = function(options, project) {
	var url = options.url;
	var branch = options.branch;
	var dir = project_git_path(project);
	console.log("Adding project via git clone from branch " + branch + " of repo " + url);

	var cloneoptions = new git.CloneOptions();
	var progress = options.progress;
	if (progress) {
		cloneoptions.fetchOpts.callbacks.transferProgress = function(tp) {
			progress.step = tp.receivedObjects() + tp.indexedObjects();
			progress.steps = tp.totalObjects() * 2;
		};
	}
	cloneoptions.checkoutBranch = branch;
	cloneoptions.fetchOpts.callbacks.credentials = function(url, userName) {
		return git.Cred.sshKeyFromAgent(userName);
	};
	//cloneoptions.bare = 1;

	var repo, commit;
	return git.Clone(url, dir, cloneoptions)
		.then(function(r) {
			repo = r;
			return repo.getHeadCommit();
		})
		.then(function(c) {
			commit = c;
			return c;
		})
		.then(git_import_commit)
		.then(function(files) {
			project.checkedout = {
				branch: branch,
				id: null
			};
			project.freefileid = files.length;
			project.files = files;
			git_read_repo(repo, project).catch(function(error) {
				console.error(error);
			});

			var fileid = files.findIndex(f => f.name.match(/readme\.md/i));
			if (fileid < 0) fileid = 0;
			var filename = files[fileid].name;
			project.view.panes = {
				0: { filename: filename, mode: "edit" },
				1: { filename: filename, mode: "preview" },
				order: ["0", "1"]
			};
			return project;
		});
};

var git_checkout = function(options, project) {
	var id = options.id;
	var branch = options.branch;
	var dir = project_git_path(project);
	console.log("Loading project via git checkout from branch " + branch + " of commit " + id);

	var repo, commit;
	return git.Repository.open(dir)
		.then(function(r) {
			repo = r;
			return repo.getCommit(id);
		})
		.then(function(c) {
			commit = c;
			return c;
		})
		.then(git_import_commit)
		.then(function(files) {
			project.checkedout = { branch: branch, id: commit.sha() };
			project.freefileid = files.length;
			project.files = files;
			return project;
		});
};

var git_push = function(options, project) {
	var dir = project_git_path(project);
	console.log("Pushing repo to server");

	var branch = "master";
	if (!branch.startsWith('refs/')) {
		branch = 'refs/heads/' + branch;
	}
	var refSpecs = [branch + ":" + branch];

	var repo, commit;
	return git.Repository.open(dir)
		.then(function(repo) {
			return repo.getRemote("origin");
		})
		.then(function(remote) {
			return remote.push(
				refSpecs, {
					callbacks: {
						credentials: function(url, userName) {
							return git.Cred.sshKeyFromAgent(userName);
						}
					}
				}
			);
		})
};

var git_pull = function(options, project) {
	var dir = project_git_path(project);
	console.log("Pulling repo from server");

	var branch = "master";
	if (!branch.startsWith('refs/')) {
		branch = 'refs/heads/' + branch;
	}
	return new Promise((resolve, reject) => reject("not implemented"));
};

var project_path = function(project) {
	return __dirname + "/projects/" + project.id;
};

var project_git_path = function(project) {
	return project_path(project) + ".git";
};

var git_commit = function(options, project) {
	console.log("Committing project via git");

	var branch = "master";
	if (!branch.startsWith('refs/')) {
		branch = 'refs/heads/' + branch;
	}
	var repo, headCommit, tree, treebuilder;

	var dir = project_git_path(project);
	return git.Repository.open(dir)
		.then(function(r) {
			repo = r;
			if (repo.headUnborn()) return null;
			return repo.getBranchCommit(branch);
		})
		.then(function(commit) {
			headCommit = commit;
			if (commit == null) return null;
			return commit.getTree();
		})
		.then(function(t) {
			tree = t;
			return git.Treebuilder.create(repo, tree);
		})
		.then(function(tb) {
			treebuilder = tb;
			return Promise.all(Object.values(project.files).map(function(file) {
				var buffer = Buffer.from(file.data, file.enc);
				return git.Blob.createFromBuffer(repo, buffer, buffer.length)
					.then(function(oid) {
						var filemode = git.TreeEntry.FILEMODE.BLOB;
						if (file.type == "symlink") filemode = git.TreeEntry.FILEMODE.LINK;
						if (file.type == "submodule") filemode = git.TreeEntry.FILEMODE.BLOB;
						return treebuilder.insert(file.name, oid, filemode);
					});
			}));
		})
		.then(function() {
			var parents = headCommit ? [headCommit] : null;
			var indexTreeId = treebuilder.write();
			var author = git.Signature.now(options.author.name, options.author.email);
			var committer = author;
			return repo.createCommit(branch, author, committer, options.message, indexTreeId, parents);
		})
		.then(function(commitId) {
			return git_read_repo(repo, project);
		});
};

var git_stash = function(options, project) {
	console.log("Stashing changes via git");

	var branch = "master";

	var repo, headCommit, tree, treebuilder;

	var dir = project_git_path(project);
	return git.Repository.open(dir)
		.then(function(r) {
			repo = r;
			return exportProjectFiles(project, ".git")
		}).then(function() {
			var stasher = git.Signature.now(options.author.name, options.author.email);
			var flags = 0;
			return git.Stash.save(repo, stasher, options.message, flags);
		})
		.then(function(commitId) {
			return repo.getHeadCommit();
		})
		.then(git_import_commit)
		.then(function(files) {
			project.checkedout = {
				branch: branch,
				id: null
			};
			project.freefileid = files.length;
			project.files = files;
			return git_read_repo(repo, project);
		});
};

var git_drop_stash = function(options, project) {
	var index = options.index;
	console.log("Dropping stash " + index + " via git");

	var repo;
	var dir = project_git_path(project);
	return git.Repository.open(dir)
		.then(function(r) {
			repo = r;
			return git.Stash.drop(repo, index);
		})
		.then(function(result) {
			return git_read_repo(repo, project);
		});
};

var git_write_files = function(options, project) {
	return exportProjectFiles(project, ".git")
};

var git_apply_stash = function(options, project) {
	var index = options.index;
	console.log("Applying stash " + index + " via git");

	var repo;
	var dir = project_git_path(project);
	return git.Repository.open(dir)
		.then(function(r) {
			repo = r;
			return git.Stash.apply(repo, index);
		})
		.then(function(result) {
			return git_read_repo(repo, project);
		});
};

var git_init = function(options, project) {
	console.log("Initializing repo via git");

	var dir = project_git_path(project);
	var isBare = 0;
	return git.Repository.init(dir, isBare);
};

var run_project = function(key, project) {
	if (key instanceof Array) return;

	var current = null;

	var run = function() {
		if (current != null) return;
		var cmd = first_command();
		if (cmd == null) return;
		exec_command(cmd).then(function() {
			run();
		}).catch(function(error) {
			console.error("Error during command:", error);
			var errormsg = error;
			if (error.message) errormsg = error.message;
			cmd[1].add("error", errormsg);
			current = null;
		});
	};

	var exec_command = function(cmd) {
		var key = cmd[0];
		var cmd = cmd[1];
		current = key;
		var fs = {
			"git_clone": git_clone,
			"git_checkout": git_checkout,
			"git_commit": git_commit,
			"git_stash": git_stash,
			"git_apply_stash": git_apply_stash,
			"git_drop_stash": git_drop_stash,
			"git_push": git_push,
			"git_pull": git_pull,
			"git_init": git_init,
			"git_write_files": git_write_files,
		};
		var f = fs[cmd.command];
		if (f == null) return new Promise((a, r) => r("unknown command " + cmd.command));
		return f(cmd.parameters, project).then(function() {
			current = null;
			project.commands.remove(key);
		});
	};

	var first_command = function() {
		var cmds = project.commands;
		cmds = cmds ? Object.entries(cmds) : [];
		cmds = cmds && cmds.filter(c => c[1].error === undefined);
		return cmds[0];
	};

	project.commands.bind("add", run);
	run();
}

var dbchangehandler = function(k, v) {
	if (
		k.length == 6 &&
		k[0] == "data" &&
		k[1] == "projects" &&
		k[3] == "files" &&
		k[5] == "data"
	) {
		var p = k[2];
		var f = k[4];
		var project = db.data.projects[p];
		exportProjectFiles(project).catch(function(error) {
			console.error(error);
		});
	}
	/*
	if (
		k.length == 3 &&
		k[0] == "data" &&
		k[1] == "projects"
	) {
		var p = k[2];
		var project = db.data.projects[p];
		run_project(p,project);
	}
	*/
};

var handledb = function(data) {
	var revive_projects = function(projects) {
		projects.bind("set", run_project);
		projects.bind("add", run_project);
		for (var p in projects)
			run_project(p, projects[p]);
	};
	data.bind("add", "projects", function(k, projects) {
		revive_projects(projects);
	});
	if (data.projects) revive_projects(data.projects);
	data.bind("set", dbchangehandler);
	data.bind("add", dbchangehandler);
}

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
	var prjid = k.shift();
	var prjs = db.data.projects;
	for (var prjk in prjs) {
		var prj = prjs[prjk];
		if (prj.id == prjid) {
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
			var files = prj.files;
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

process.on("unhandledRejection", (error) => {
	console.error(error); // This prints error with stack included (as for normal errors)
	//throw error; // Following best practices re-throw error and let the process exit with error code
});

var start = function(options) {
	app = https.createServer(options, httpHandler);
	redirapp = http.createServer(redirectHandler);
	io = require('socket.io').listen(app);
	dbs = Maggi.db.server(io, dbname);
	db = dbs[dbname];
	handledb(db.data);
	app.listen(secureport);
	redirapp.listen(port);
	console.log("Maggi Projects Server " + serverURL);
}

//setTimeout(function() {
load_certificates().then(start);
//},10000);
