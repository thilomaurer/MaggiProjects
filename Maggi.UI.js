/*!
 * Maggi.UI.js JavaScript Library 
 * https://home.thilomaurer.de/Maggi.js
 *
 * Copyright (C) 2015-11-14 Thilo Maurer
 * All Rights Reserved.
 * 
 */

Maggi.id=0;

Maggi.UI_devel=function(dom) {
	var a=Maggi({data:null,ui:null});
	var backbuild=null;
	a.bind(function(k) {
		if (k instanceof Array) return;
		if (backbuild) backbuild();
		backbuild=Maggi.UI(dom,a.data,a.ui);
	});
	return a;
};

var installBindings=function(handlers) {
	$.each(handlers,function(idx,v) {
		var o=v[0];
		var e=v[1];
		var k=v[2];
		var f=v[3];
		if (o!=null) {
			o.bind(e,k,f);
			f(k,o[k]);
		} else console.log("bind to null ignored");
	});
	return function() {
		$.each(handlers,function(idx,v) {
			var o=v[0];
			var e=v[1];
			var k=v[2];
			var f=v[3];
			if (o!=null) {
				o.unbind(e,f); //TODO: (e,k,f);
			} else console.log("unbind from null ignored");
		});
	};
};


Array_unique = function (a) {
    var r = new Array();
    o:for(var i = 0, n = a.length; i < n; i++)
    {
        for(var x = 0, y = r.length; x < y; x++)
        {
            if(r[x]==a[i])
            {
                continue o;
            }
        }
        r[r.length] = a[i];
    }
    return r;
};

Maggi.UI=function(dom,data,ui,setdata,onDataChange) {
	function cookui(ui) {
		if (ui===null) return ui;
		if (typeof ui === "function") ui=ui();
		if (typeof ui === "string") ui={type:ui};
		if (!ui.hasOwnProperty("type")) ui.type="object";
		if (ui.type === null) ui.type="object";
		ui=Maggi(ui);
		return ui;
	}
	if (!dom) return;
	ui=cookui(ui);
	if (!ui) return;
	var f;
	if (ui.type=="user") f=ui.user;	else f=Maggi.UI[ui.type];
	if (f) {
		if (ui.wrap==true)  {
			dom.addClass("wrap");
			var wrap=$("<div>").appendTo(dom);
			wrap._MaggiParent=dom._MaggiParent;
			dom=wrap;
		}
		return f(dom,data,setdata,ui,onDataChange); 
	}
	else 
		console.log("Maggi.UI: unknown ui.type '"+ui.type+"'");
};

//non-object UI handlers

Maggi.UI.BaseFunctionality=function(dom,data,setdata,ui,onDataChange) {
	var updateClass = function(v, dom, cls) {
		if (v) dom.addClass(cls); else dom.removeClass(cls); 
	};
	var vissethandler=function(k,v) {
		updateClass(v==false,dom,"invisible");
	};
	var backbuilder=null;
	dom.addClass(ui.type);
	if (ui.popup==true) {
		var triggerElement=dom._MaggiParent.ui[ui.popuptrigger];
		var deco=$('<div/>', {'class': "popup-triangle-wrapper"}).appendTo(dom);
		var deco2=$('<div/>', {'class': "popup-triangle-inner"}).appendTo(deco);
		dom.addClass("popup visibilityanimate");

		if (triggerElement==null) { console.log("Maggi.UI: triggerelement not found."); return; }
		var triggerElementClick=function() {
			ui.visible=!ui.visible;
			return false;
		};
		triggerElement.on("click",triggerElementClick);

		var getInnerClientRect = function(dom) {
			var outer=dom[0].getBoundingClientRect();
			var pad = function(dom,dir) {
				return parseInt(dom.css("padding-"+dir).replace("px",""));
			};
			var left=outer.left+pad(dom,"left");
			var top=outer.top+pad(dom,"top");
			var bottom=outer.bottom-pad(dom,"bottom");
			var right=outer.right-pad(dom,"right");
			top=top+window.scrollY;
			bottom=bottom+window.scrollY;
			left=left+window.scrollX;
			right=right+window.scrollX;
			return {left:left,right:right,top:top,bottom:bottom};
		};

		var place = function()
		{
			var spacing=16;
			var pt=triggerElement.offset();
			//var rect=triggerElement.getBoundingClientRect();
			var rect=getInnerClientRect(triggerElement);
			dom.css("left",0);
			var wh=dom.width()/2+spacing;
//			console.log("wh "+wh);

			var attach={x:(rect.left+rect.right)/2,y:rect.bottom};
			var overlap=attach.x+wh-$('body').width();
//			console.log("overlap "+overlap);
			var left=attach.x-wh;
			if (overlap>0) left=left-overlap;
			if (left<0) left=0;

			dom.css("top",attach.y);
			dom.css("left",left);
			if (attach.y+dom.height()+2*spacing-$('body').height()>0)
				dom.css("bottom",0);
			var ml=attach.x-left-2*spacing;
			var mlmax=2*(wh-spacing)-2*spacing-8;
			var mlmin=8;
			if (ml>mlmax) ml=mlmax;
			if (ml<mlmin) ml=mlmin;
			deco.css("margin-left",ml);
		};
		vissethandler=function(k,v) {
			updateClass(v==false,dom,"invisible");
			if (v) { 
				place();
				if (ui.popupfocus) {
					var p=dom.ui[ui.popupfocus]._Maggi[0];
					p.focus();
					p.select();
				}
			}
		};
		if (!ui.hasOwnProperty("visible")) ui.add("visible",false); 
		if (ui.visible==false) { dom.addClass("invisible");}

		var observer = new MutationObserver(place);
		observer.observe(dom[0], { childList:true });
		observer.observe(triggerElement[0], { childList:true });
		$(window).resize(place);

		backbuilder=function() {
			observer.disconnect();
			$(window).off("resize",place);
			triggerElement.off("click",triggerElementClick);
			dom.removeClass("popup");
			deco.remove();
		};
	}
	if (ui.wrappedpopup==true) {
		var wrap=$('<div/>').insertBefore(dom);
		dom.appendTo(wrap);
		var triggerElement=dom._MaggiParent.ui[ui.popuptrigger];
		var deco=$('<div/>', {'class': "popup-triangle-wrapper"}).appendTo(dom);
		var deco2=$('<div/>', {'class': "popup-triangle-inner"}).appendTo(deco);
		dom.addClass("popup visibilityanimate");

		if (triggerElement==null) { console.log("Maggi.UI: triggerelement not found."); return; }
		triggerElementClick=function() {
			ui.visible=!ui.visible;
			return false;
		};
		triggerElement.on("click",triggerElementClick);

		var getInnerClientRect = function(dom) {
			var outer=dom[0].getBoundingClientRect();
			var pad = function(dom,dir) {
				return parseInt(dom.css("padding-"+dir).replace("px",""));
			};
			var left=outer.left+pad(dom,"left");
			var top=outer.top+pad(dom,"top");
			var bottom=outer.bottom-pad(dom,"bottom");
			var right=outer.right-pad(dom,"right");
			top=top+window.scrollY;
			bottom=bottom+window.scrollY;
			left=left+window.scrollX;
			right=right+window.scrollX;
			return {left:left,right:right,top:top,bottom:bottom};
		};

		var place = function()
		{
			var spacing=16;
			var pt=triggerElement.offset();
			//var rect=triggerElement.getBoundingClientRect();
			var rect=getInnerClientRect(triggerElement);
			dom.css("left",0);
			var wh=dom.width()/2+spacing;

			var attach={x:(rect.left+rect.right)/2,y:rect.bottom};
			var overlap=attach.x+wh-$('body').width();
			var left=attach.x-wh;
			if (overlap>0) left=left-overlap;
			if (left<0) left=0;

			dom.css("top",attach.y);
			dom.css("left",left);
			var ml=attach.x-left-2*spacing;
			var mlmax=2*(wh-spacing)-2*spacing-8;
			var mlmin=8;
			if (ml>mlmax) ml=mlmax;
			if (ml<mlmin) ml=mlmin;
			deco.css("margin-left",ml);
		}
		vissethandler=function(k,v) {
			updateClass(v==false,dom,"invisible");
			if (v) { 
				place();
				if (ui.popupfocus) {
					var p=dom.ui[ui.popupfocus]._Maggi[0];
					p.focus();
					p.select();
				}
			}
		};
		if (!ui.hasOwnProperty("visible")) ui.add("visible",false); 
		if (ui.visible==false) { dom.addClass("invisible");}
		
		var observer = new MutationObserver(place);
		observer.observe(dom[0], { childList:true });
		observer.observe(triggerElement[0], { childList:true });
		$(window).resize(place);

		backbuilder=function() {
			observer.disconnect();
			$(window).off("resize",place);
			triggerElement.off("click",triggerElementClick);	
			dom.removeClass("popup");
			deco.remove();
		};
	}
	if (ui.popup==null) {
		updateClass(ui.visible==false,dom,"invisible");
	}
	var sethandler = function(k,v,oldv) {
		if (k=="enabled") updateClass(v==false,dom,"disabled");
		if (k=="class") { dom.removeClass(oldv); dom.addClass(v); }
	};
	ui.bind(["add","set"],"visible",vissethandler);
	ui.bind("set",sethandler);
	updateClass(ui.enabled==false,dom,"disabled");
	
	var onClick=function(e) {
	    var handled=(ui.onClick!=null&&(ui.enabled!=false));
	    if (handled) ui.onClick();
	    return !handled;
	};
	dom.on("click",onClick);
	
	if (ui.class) 
		dom.addClass(ui.class);
	return function() {
		dom.off("click",onClick);
	    
		ui.unbind("set",sethandler);
		ui.unbind("set",vissethandler);
		dom.removeClass(ui.class);
		dom.removeClass(ui.type);
		if (backbuilder) { backbuilder(); backbuilder=null; }
	};
};

Maggi.UI.parentclass=function(dom,data,setdata,format,onDataChange) {
	if (!dom._Maggi) {
		var p=dom._MaggiParent;
		p.addClass(data);
		p._Maggi.bind("set",function(k,newv,oldv) { 
			if (k=="state") {
				p.removeClass(oldv);
				p.addClass(newv);
			}
		});
	}
	dom._Maggi=true;
};

Maggi.UI.text=function(dom,data,setdata,ui,onDataChange) {
	//same for all?
	var unbase=Maggi.UI.BaseFunctionality(dom,data,setdata,ui,onDataChange);

	var build=function(data) {
		var s="(null)";
		if (data!=null) { 
			if (ui.format) {
				if (data instanceof Date)
					data=data.toString();
				if (data instanceof Object){
					data=Object.keys(data).map(function (key) {return data[key]});
				}
				else {
					data=[data];
				}
				s=vsprintf(ui.format,data) 
			}
			else
				s=data.toString();
		}
		dom.text(s);
	};

	onDataChange(build);
	build(data);
	
	//same for all? should be in onDataChange
	var backbuild_builder;
	if (ui.builder) backbuild_builder=ui.builder(dom,data,ui);
	return function() {
		if (backbuild_builder) { backbuild_builder(); backbuild_builder=null; }
		unbase();
	};
};

Maggi.UI.label=function(dom,data,setdata,ui,onDataChange) {
	//same for all?
	var unbase=Maggi.UI.BaseFunctionality(dom,data,setdata,ui,onDataChange);

	var setLabel=function(k,v) {
		dom.text(v);
	};

	var handlers=[
		[ui,["add","set"],"label",setLabel]
	];
	var unbind=installBindings(handlers);

	//same for all? should be in onDataChange
	var backbuild_builder;
	if (ui.builder) backbuild_builder=ui.builder(dom,data,ui);
	return function() {
		if (backbuild_builder) { backbuild_builder(); backbuild_builder=null; }
		unbind();
		unbase();
	};
};

Maggi.UI.html=function(dom,data,setdata,ui,onDataChange) {
	var unbase=Maggi.UI.BaseFunctionality(dom,data,setdata,ui,onDataChange);
	dom.html(data&&data.toString());
	return unbase;
};

Maggi.UI.link=function(dom,data,setdata,ui,onDataChange) {
	if (!dom._Maggi) {
		var unbase=Maggi.UI.BaseFunctionality(dom,data,setdata,ui,onDataChange);
		dom._Maggi=$('<a>', {href:data,text:ui.label,target:ui.target}).appendTo(dom);
		var sethandler=function(k,v) {
			if (k=="label") dom._Maggi.text(v);
			if (k=="target") dom._Maggi.attr("target",v);
		};
		ui.bind(sethandler);
		return function() { ui.unbind(sethandler); unbase(); delete dom._Maggi;}
	} else dom._Maggi.attr("href",data);
};

Maggi.UI.image=function(dom,data,setdata,ui,onDataChange) {
	var update = function(data) {
		var url=data;
		if (ui.urls!=null) url=ui.urls[data];
		img.attr("src",url);
	};
	var unbase=Maggi.UI.BaseFunctionality(dom,data,setdata,ui,onDataChange);
	var img=$('<img>').appendTo(dom);
	dom._Maggi=img;
	onDataChange(update);
	ui.bind("set","urls",update);
	update(data);
};

Maggi.UI.checkbox=function(dom,data,setdata,ui,onDataChange) {
	if (!dom._Maggi) {
		var unbase=Maggi.UI.BaseFunctionality(dom,data,setdata,ui,onDataChange);
		var name="maggi_"+Maggi.UI.select.counter.toString(); Maggi.UI.select.counter++;
		var id=name+"_id";
		if (ui.labelposition=="before") $("<label>",{for:id,text:ui.label}).appendTo(dom);
		dom._Maggi=$("<input>",{name:name,id:id,type:"checkbox"}).appendTo(dom).change(function() {
			if (setdata) setdata(this.checked);
		});
		$("<label>",{for:id,id:"toggle"}).appendTo(dom);
		if (ui.labelposition!="before") $("<label>",{for:id,text:ui.label}).appendTo(dom);
	} 
	dom._Maggi[0].checked=data;
};

Maggi.UI.input=function(dom,data,setdata,ui,onDataChange) {
	var autolength=function(o,v) {
		if (ui.autosize) {
			if (v==null) v="";
			v=v.toString();
			var l=v.length;
			if (l==0) o.addClass("empty"); else o.removeClass("empty");
			o.attr("size",l);
		}
	}
	var unbase=Maggi.UI.BaseFunctionality(dom,data,setdata,ui,onDataChange);
	dom.empty();
	var prefix=$("<span>",{id:"prefix"}).appendTo(dom);
	var postfix=$("<span>",{id:"postfix"}).appendTo(dom);
	var midfix=$("<span>",{id:"midfix"}).appendTo(dom);
	
	var updatePrefix=function() {
		prefix.text(ui.prefix);
	}
	ui.bind("set","prefix",updatePrefix);
	updatePrefix();
	
	var updatePostfix=function() {
		postfix.text(ui.postfix);
	}
	ui.bind("set","postfix",updatePostfix);
	updatePostfix();

	var i=$('<input/>', { type: ui.kind, placeholder:ui.placeholder }).appendTo(midfix)
	  .on("input",function(event) { 
		autolength(i,this.value);
		setdata(this.value);
		event.stopPropagation();
	}).on("keypress",function(event) { 
		if (event.keyCode == '13') { if (ui.onReturnKey) ui.onReturnKey(this.value); }
		event.stopPropagation();
	}).keydown(function(event) {
		event.stopPropagation();
	}).focus(function() {
		dom.addClass('focused');
	}).blur(function() {
		dom.removeClass('focused');
	});
	ui.bind("set","placeholder",i.attr);
	var datachange=function(data) {
		if (ui.kind=="file") return;
		var newvalue=data&&data.toString();
		if (i[0].value!=newvalue) i[0].value=newvalue;
		autolength(i,newvalue);
	};
	onDataChange(datachange);
	datachange(data);
	dom.click(function(event) {i.focus(); event.stopPropagation();});
	dom._Maggi=i; //deprecated?
	return function() {
		ui.unbind("set",i.attr);
		dom._Maggi=null;
		unbase();
	};
};

Maggi.UI.function=function(dom,data,setdata,ui,onDataChange) {
	var unbase=Maggi.UI.BaseFunctionality(dom,data,setdata,ui,onDataChange);
	var update=function() {
		if (ui.label!=null) dom.text(ui.label);
	};
	update();
	ui.bind("set","label",update);
	dom.click(function() {
		if (ui.enabled!=false) if (data) data(dom._MaggiParent._Maggi);
		return false;
	});
	return function() {
		dom.off("click");
		unbase();
	}
};

Maggi.UI.select=function(dom,data,setdata,ui,onDataChange) {
	var unbase=Maggi.UI.BaseFunctionality(dom,data,setdata,ui,onDataChange);
	var name="maggi_radiogroup_"+Maggi.UI.select.counter.toString(); Maggi.UI.select.counter++;
	var chld={};
	dom._Maggi=chld;
	$.each(ui.choices,function(key,value) {
		var id=name+"_"+key.toString();
		chld[key]=$("<input>",{name:name,id:id,value:key,type:"radio",checked:key==data}).appendTo(dom).change(function() {
			if (this.checked) setdata(key);
		});
		var text=value.label;
		if (text==null) text=value;
		$("<label>",{for:id,text:text}).appendTo(dom);
	});

	onDataChange(function(data) {
		chld[data].prop('checked', true);
	});

	var formatsethandler=function() {};
	
	ui.bind("set",formatsethandler);
	var backbuild_builder=null;
	if (ui.builder) backbuild_builder=ui.builder(dom,data,ui); //must be last in build

	return function() {
		if (backbuild_builder) { backbuild_builder(); backbuild_builder=null; }
		ui.unbind(formatsethandler);
		unbase();
	};

};

Maggi.UI.select.counter=0;

Maggi.UI.object=function(dom,data,setdata,ui,onDataChange) {
	var chld={};
	var backbuild={};
	var sethandler={};
	dom.ui=chld;
	var wrap={};
	var id=Maggi.id++;

	var hasExplicitFormat=function(k) {
		return ui.children[k]!=null;
	};

	var getFormat=function(k) {
		if (hasExplicitFormat(k)) return ui.children[k];
		var fmt="text";
		if ((data[k] instanceof Object)&&(!(data[k] instanceof Date))) fmt="object";
		if (((data[k] instanceof Object)&&(!(data[k] instanceof Date))&&(!(typeof data[k] == "function")))&&(fmt.type=="text"||fmt.type=="input")) {
			fmt={type:"object",childdefault:ui.childdefault,makechildlabels:ui.makechildlabels};
		}
		return fmt;
	};
	var update=function(k,v) {
		if (!(k instanceof Array)) {
			if (sethandler[k]) 
				sethandler[k](v);
		}
	};

	var order=function() {
		if (ui.order) {
			return Object.keys(ui.order).sort().map(function(k) { return ui.order[k]; });
		} else if (ui.childdefault) {
			return Object.keys(data);
		} else {
			return Object.keys(ui.children);
		}
	}

	var place=function(k) {
		var w=wrap[k];
		var o=order();
		var idx=o.indexOf(k);
		if (idx==0) {
		    w.prependTo(dom); 
		} else {
    		var beforek=o[idx-1];
    		if (beforek==null||wrap[beforek]==null)
    			w.appendTo(dom); 
    		else 
    			w.insertAfter(wrap[beforek]);
		}
	};

	var make=function(k) {
		if (backbuild[k]) {
			backbuild[k]();
			delete backbuild[k];
		}
		if (wrap[k]) wrap[k].remove();
		if (chld[k]) chld[k].remove();

		var c=$("<"+(ui.childHTMLElement||"div")+">",{id:k});

		if (ui.makechildlabels) { 
			$("<div>",{"class":"label",text:k}).appendTo(c); 
			c=$("<div>").appendTo(c); 
		}
		c._MaggiParent=dom;  //ugly hack to enable access to parent

		var w=c;
		if (ui.wrapchildren==true)
			w=$("<div>",{"class":"wrap"}).append(c);
		if (ui.wrapchildren==2) {
			w=$("<div>",{"class":"wrap"}).append(c);
			w=$("<div>",{"class":"wrap"}).append(w);
		}
		chld[k]=c;
		wrap[k]=w;
		place(k);
		backbuild[k]=Maggi.UI(chld[k],data[k],getFormat(k),function(v) { 
			data[k]=v;
		}, function(fn) {
			sethandler[k]=fn;
		});
	};
	var fromdefault={};
	var add=function(k) {
		if (k instanceof Array) return;
		wrap[k]=null;
		ui.children.bind("set",k,make);
		if (data==null) return;
		if (!hasExplicitFormat(k)) {
			if (ui.childdefault!=null) {
				var u=ui.childdefault;
				if (typeof u === "function") u=u();
				fromdefault[k]=true;
				ui.children.add(k,u);
			}
			return;
		}
		if (typeof ui.children[k] === "function") {
			ui.children[k]=ui.children[k]();
		}
		make(k);
	};
	var remove=function(k) {
		ui.children.unbind("set",make); //what is this line for?
		if (fromdefault[k]==true) {
		    //ui.children[k]=null;
		    delete ui.children[k];
		    fromdefault[k]=false;
		}
		if (wrap.hasOwnProperty(k)) {
			if (wrap[k]!=null) wrap[k].remove(); 
			if (backbuild[k]) {
				backbuild[k](); 
				delete backbuild[k];
			}
			delete chld[k]; 
			delete wrap[k]; 
		}
	};
	var removeall=function() {
		for (var k in wrap) remove(k);
	};
	var formatsethandler=function(k,newv,oldv) {
		var hasPropValue = function(o,v) {
			for (var k in o) { if (o[k]==v) return true; }
			return false;
		};
		if (k[0]=="order") {
			v=newv;
			if (wrap[v]) place(v); else add(v);
		}
		if (k=="order") {
			if (oldv==null) oldv=Object.keys(chld); 
			$.each(oldv, function(idx,k) { if (!hasPropValue(newv,k)) remove(k); });
			$.each(order(),function(idx,k) { if (wrap[k]) place(k); else add(k); });
		}
		if (k=="data") {
			rebuild(newv);
		}
	};
	
	var backbuild_builder;
	var setbuilder=function() {
		    if (backbuild_builder) { backbuild_builder(); backbuild_builder=null; }
		    if (ui.builder) backbuild_builder=ui.builder(dom,data,ui); //must be last in build
    };

	var backbuild_base;

	var build=function(newdata) {
		data=newdata;
		if (ui.data!=null) data=ui.data;

		backbuild_base=Maggi.UI.BaseFunctionality(dom,data,setdata,ui,onDataChange);

		dom._Maggi=data;
		if (data&&typeof data == "object") {
			data.bind("set", update);
			data.bind("add", add);
			data.bind("remove", remove);
		}
		ui.children.bind("add", add);
		ui.children.bind("remove", remove);
		ui.bind(["set","add"],formatsethandler);
		if (ui.order) {
			$.each(ui.order, function(idx,v) { add(v); });
		} else {
			var uic=ui.children;
			var a=Object.keys(uic);
			if (data)
				a=Array_unique(a.concat(Object.keys(data)));
			$.each(a, function(idx,v) { add(v); });
		}
		ui.bind("set","builder",setbuilder);
		setbuilder();
	};
	
	var backbuild=function() {
		if (backbuild_builder) { backbuild_builder(); backbuild_builder=null; } //must be first in backbuild
		if (data) {
			data.unbind("set", update);
			data.unbind("add", add);
			data.unbind("remove", remove);
		}
		if (ui) {
			ui.children.unbind("add",add);
			ui.children.unbind("remove",remove);
			ui.unbind(["set","add"],formatsethandler);
			ui.unbind("set",setbuilder)
		}
		if (backbuild_base) { backbuild_base(); backbuild_base=null; }
		removeall();
		dom._Maggi=null;
	};

	var rebuild=function(newdata) {
		backbuild();
		build(newdata);
	};

	if (ui.children==null) ui.add("children",{});
	
	if (onDataChange) onDataChange(rebuild);
	build(data);

	return backbuild;
};

Maggi.UI.tabs=function(ui,o,seto,format,onDataChange) {
	if (o==null) {ui.empty(); return; }
	if (!(ui._Maggi===o)) {
		var unbase=Maggi.UI.BaseFunctionality(ui,o,seto,format,onDataChange);
		ui._Maggi=o;
		ui.empty();
		ui.head=$("<div>",{id:"_Maggi_UI_TabView_Header"}).appendTo(ui); 
		if (format.headerdata&&format.headerui) { 
			Maggi.UI(ui.head,format.headerdata,format.headerui, function(v) {format.headerdata=v; }); 
			$.each(ui.head.ui,function(k,v) {
				v.click(function() { format.selected=k; return false;});
			});
		}
		ui.chld=$("<div>",{id:"_Maggi_UI_TabView_Container"}).appendTo(ui);

		Maggi.UI.object(ui.chld,o,seto,format);
		var select=function(k,s) {
			if (s&&ui.chld.ui[s]) {
				ui.chld.ui[s].removeClass("selected");
				ui.head.ui[s].removeClass("selected");
			}
			if (k&&ui.chld.ui[k]) {
				format.selected=k;
				ui.chld.ui[k].addClass("selected");
				ui.head.ui[k].addClass("selected");
			}
		}
		select(format.selected,null);
		format.bind("set",function(k,v,oldv) {
			if (k=="selected") select(v,oldv);
		});
	}
};

Maggi.UI.list=function(dom,data,setdata,ui,onDataChange) {
	var chld={};
	var installClick = function(k,v) {
		if (ui.select=="single"||ui.select=="multi")
			v.click(function() { 
				if (ui.children[k].enabled!=false) select(k);
			}); 
	};
	var select=function(k) {
		if (ui.select=="single") ui.selected=k;
		else ui.selected.add(k,!ui.selected[k]);
	};
	var updateSingleSelection = function(newv,oldv) {
		if (oldv!=null) if (chld[oldv]) chld[oldv].removeClass("selected");
		if (newv!=null) if (chld[newv]) chld[newv].addClass("selected");
	};
	var updateMultiSelection = function(k,v) {
		var c=chld[k];
		if (c) if (v) c.addClass("selected"); else c.removeClass("selected");
	};
	var formatsethandler=function(k,newv,oldv) {
		if (k=="selected") updateSingleSelection(newv,oldv);
		if (k[0]=="selected") updateMultiSelection(k[1],newv,oldv);
		if (k=="select") {
			if (newv=="single") ui.selected=null;
			if (newv=="multi") ui.selected={};
		}
	};
	var add = function(k,v) {
		if (!(k instanceof Array)) installClick(k,dom.ui[k]);	
	};
	var remove = function(k,v) {
		//if (!(k instanceof Array)) uninstallClick(k,dom.ui[k]);	
	};

	var objsethandler=null;
 	var backbuild_base=null;
	var backbuild_header=null;
	
	var build=function() {
		if (ui.header) {
			var head=$("<div>",{id:"_Maggi_UI_List_Header"}).appendTo(dom);
			backbuild_header=Maggi.UI(head, ui.header.data, ui.header.ui, function(v) { ui.header.data=v; }); 
		}

		var childHTMLElement="div";
		var listContainerHTMLElement="div";
		if (ui.listtype=="ordered") listContainerHTMLElement="ol";
		if (ui.listtype=="unordered") listContainerHTMLElement="ul";
		if (ui.listtype) { dom.empty(); ui.childHTMLElement="li"; dom=$('<'+listContainerHTMLElement+'>').appendTo(dom); }
		backbuild_base=Maggi.UI.object(dom,data,setdata,ui,function(fn) { objsethandler=fn; });
		chld=dom.ui;
		$.each(chld,installClick);
		if (ui.select=="single") updateSingleSelection(ui.selected,null);
		if (ui.select=="multi") $.each(ui.selected, updateMultiSelection);
		if (data) {
			data.bind("add",add);
			data.bind("remove",remove);
		}
	};
	
	var backbuild=function() {
		if (data) {
			data.unbind("add", add);
			data.unbind("remove", remove);
		}
		objsethandler=null;
		if (backbuild_base) { backbuild_base(); backbuild_base=null; }
		if (backbuild_header) { backbuild_header(); backbuild_header=null; }
		dom._Maggi=null;
	};

	var rebuild=function(newdata) {
		backbuild();
		data=newdata;
		build();
	};
	
	ui.bind("set",formatsethandler);
	
	if (onDataChange) onDataChange(rebuild);
	build();

	return function() {
		backbuild();
		ui.unbind("set",formatsethandler);
	};

};

