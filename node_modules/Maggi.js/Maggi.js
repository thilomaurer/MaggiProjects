/*!
 * Maggi.js JavaScript Library 
 * https://home.thilomaurer.de/Maggi.js
 *
 * Copyright (C) 2014-05-22 Thilo Maurer
 * All Rights Reserved.
 * 
 */

var Maggi=function(other) {
	var d={},p={},events={};

	if (!(other instanceof Date)) if (!(other instanceof Function)) if (other instanceof Object) if (other._hasMaggi) return other;

	var trigger = function(e,key,value,oldv) {
		var fns=events[e];
		if (fns==null) return;
		for (var i=0; i<fns.length; i++) {
			var f=fns[i];
			if (!f.keys||(f.keys.indexOf(key)>-1)) {
				if (Maggi.log==true) 
					console.log("trigger "+e+" for "+JSON.stringify(key));
				f.fn(key,value,oldv,e);
			}
		}
	}

	func = {
		add: function(key,value) {
			var get = function() {
					var v=d[key];
					trigger("get",key,v);
					return v; 
			};
			var set = function(v) {
				if (!(v instanceof Date)) if (!(v instanceof Function)) if (v instanceof Object) if (v._hasMaggi!=true) v=Maggi(v);
				var oldv=d[key];
				if (v==oldv) return;
				uninstallBubble(oldv);
				installBubble(v);
				d[key]=v;
				trigger("set",key,v,oldv);
			}
			var bubbleEvents=["set","remove","add"];
			var bubble=function(e,k,v,oldv) {
				var bubblekey;
				if (k instanceof Array)
					bubblekey=k.slice(0);
				else 
					bubblekey=[k];

				bubblekey.unshift(key);
				trigger(e,bubblekey,v,oldv);
			};
			var bubbleFuncs={};
			bubbleEvents.forEach(function(e) {
				bubbleFuncs[e]=function(k,v,oldv) { bubble(e,k,v,oldv) };
			});
			var installBubble=function(value) {
				//propage child events to parent
				if (value&&value._hasMaggi) {
					bubbleEvents.forEach(function(e) {
						value.bind(e,bubbleFuncs[e]);
					});
				}
			}
			var uninstallBubble=function(value) {
				if (value&&value._hasMaggi) {
					bubbleEvents.forEach(function(e) {
						value.unbind(e,bubbleFuncs[e]);
					});
				}
			}
			if (p.hasOwnProperty(key)) { 
				//console.log('Maggi: set by add for property "'+key+'" of '+JSON.stringify(p)+'.');
				set(value);
				return;
			} else {
				if (!(value instanceof Date)) if (!(value instanceof Function)) if (value instanceof Object) if (value._hasMaggi!=true) value=Maggi(value);
				d[key]=value;
				var prop={get: get, set: set, enumerable: true, configurable: true};
				Object.defineProperty(p,key,prop);
				installBubble(value);
				trigger("add",key,value);
			}
		},
		remove: function(key) {
			if (!d.hasOwnProperty(key)) return;
			var value=d[key];
			delete p[key];
			delete d[key];
			trigger("remove",key,value); //fire remove last time
			p.unbind(key);               //before removing all bindings for key
		},
		bind: function() {
			var ts,ks,fn;
			var arg=arguments;
			var n=arg.length;
			var makeArray = function(idx) {
				var a=arg[idx];
				if (a instanceof Array) return a;
				return [a];
			}
			if (n>=3) {
				ts=makeArray(0);	
				ks=makeArray(1);	
				fn=makeArray(2);	
			}
			if (n==2) {
				ts=makeArray(0);	
				ks=null;	
				fn=makeArray(1);	
			}
			if (n==1) {
				ts=["set"];	
				ks=null;	
				fn=makeArray(0);	
			}
			for (var ik in ts) {
				var k=ts[ik];
				if (events[k]==null) events[k]=[];
				for (var i in fn) {
					events[k].push({fn:fn[i],keys:ks});
				}
			}
		},
		unbind: function(ks,fn) {
			if (typeof ks === 'function') { fn=ks; ks=["set"]; }
			if (typeof ks === "string") ks=[ks];
			if (fn==null) {
				//remove all bindings for each keys in ks
				for (var ik in ks) {
					var k=ks[ik];
					events[k]=[];
				}
				return;
			}
			var indexOf=function(A,propname,value) {
				if (!A) return -1;
				for (var idx=0;idx<A.length;idx++) {
					var v=A[idx];
					if (v.hasOwnProperty(propname))
						if (v[propname]==value) return idx;
				}
				return -1;
			};
			if (!(fn instanceof Array)) fn=[fn];
			for (var ik in ks) {
				var k=ks[ik];
				if (events[k]) for (var i in fn) { 
					//var idx=events[k].indexOf(fn[i]);
					var idx=indexOf(events[k],"fn",fn[i]);
					if (idx>=0) events[k].splice(idx,1);
				}
			}
		},
		set: function(kv) {
			for (var i = 0; i<kv.length; i++) {
				var k=kv[i][0];
				var v=kv[i][1];
				d[k]=v;
				trigger("set",k,v);
			}
		},
		trigger: trigger,
		_hasMaggi: true
	};

	var myeach=function(o,action) {
		if (o)
			for (var k in o) 
				action(k,o[k]);
	};
	myeach(func,function(key,value) {
		Object.defineProperty(p,key,{value:value, enumerable:false, writeable:false, configurable:false});
	});
	myeach(other,p.add);

	return p;
};

Maggi.apply = function(data,d) {
	var e=d.e; var k=d.k; var v=d.v;
	if (Maggi.apply.log) console.log("Maggi.apply: e="+e+", k="+k);
	if (k==null) {
		for (var k in v) 
			data.add(k,v[k]);
	} else if (k instanceof Array) {
		var k0=k.shift();
		var d0=data[k0];
		if (d0==null) {
			var o;
			var oo=v;
			for (var i=k.length-1;i>=0;i--) {
				o={}; o[k[i]]=oo;
				oo=o;
			}
			data.add(k0,oo);
		} else {
			if (k.length==1) d.k=k[0];
			Maggi.apply(d0,d);
		}
	} else {
		if (e=="set")
			data[k]=v;
		if (e=="remove")
			data.remove(k);
		if (e=="add")
			data.add(k,v);
	}
};

var log=function(tag,socket,d) {
	if (Maggi.sync.log!=true) return
	var text=tag + " client=" + socket.id;
	if (d!=null) text += " " + JSON.stringify(d,function(k,v) {if (k=="v") return v.length; else return v;});
	console.log(text);
};

Maggi.sync = function(socket,db,client) {
	var applying=false;
	var emit=function(d) { log("Maggi send",socket,d); socket.emit("Maggi",JSON.stringify(d)); };
	var handler=function(k,v,oldv,e) {
		if (applying) return;
		db.rev+=1;
		emit({f:"delta",e:e,k:k,v:v,rev:db.rev});
	};
	var apply=function(d) {
		applying=true;
		Maggi.apply(db.data,d);
		db.rev=d.rev;
		applying=false; 
	}
	db.data.bind(["set","add","remove"],handler);
	socket.on('Maggi', function(json) {
		var d=JSON.parse(json);
		log("Maggi recv", socket, d);
		if (d.f=="delta") {
			if (d.rev==db.rev+1) {
				apply(d);
			} else {
				emit({f:"error",id:"old_rev", cur_rev:db.rev, req_rev:d.rev});
			}
		}
		if (d.f=="request") 
			emit({f:"response",e:"add",k:null,v:db.data,rev:db.rev});
		if (d.f=="response") 
			apply(d);
		if (d.f=="error") 
			if (client&&d.id=="old_rev") emit({f:"request"});

	});
	socket.on('disconnect',function() {
		db.data.unbind(handler);
		console.log("disconnected " + socket.id);
	});
	if (client) emit({f:"request"});
};

Maggi.serve = function(socket,db) {
	log("Maggi.serve",socket);
	Maggi.sync(socket,db,false);
};

Maggi.client = function(socket,data) {
	var db={data:data,rev:0};
	Maggi.sync(socket,db,true);
};

if (typeof module !== 'undefined')
	module.exports = Maggi;
