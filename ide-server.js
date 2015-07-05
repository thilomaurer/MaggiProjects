var app = require('http').createServer(httpHandler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    mime = require('mime'),
    Maggi = require('Maggi.js'),
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


Maggi.ff=function(fn) {
	var data;
	var fp=__dirname + "/" + fn;
	var enc="utf8";
	var saving=false;
	var save_again=false;
	var save=function() {
		save_again=saving;
		if (saving) return;
		saving=true;
		fs.writeFile(fp, JSON.stringify(data), enc, function(err) {
			saving=false;
			if (err) console.log(JSON.stringify(err));
			if (save_again) save();
		}); 
	};
	data=fs.readFileSync(fp, enc);
	data=JSON.parse(data);
	data=Maggi(data);
	data.bind(["set","remove","add"],save);
	return data;
};

var data=Maggi.ff("data");

io.sockets.on('connection', function(socket) {
	console.log("new connection by client socket "+socket.id);
	allconnections.push(socket);
	Maggi.serve(socket,data);
});

console.log("Maggi.UI IDE Server localhost:"+port);
app.listen(port);
