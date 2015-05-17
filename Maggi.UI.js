/*!
 * Maggi.UI.js JavaScript Library 
 * https://home.thilomaurer.de/Maggi.js
 *
 * Copyright (C) 2014-05-22 Thilo Maurer
 * All Rights Reserved.
 * 
 */


Maggi.UI=function(dom,data,ui,setdata,datachange) {
	function cookui(ui) {
		if (!ui) return;
		if (typeof ui === "function") ui=ui();
		if (typeof ui === "string") ui={type:ui};
		ui=Maggi(ui);
		return ui;
	}
	if (!dom) return;
	ui=cookui(ui);
	if (!ui) return;
	var f;
	if (ui.type=="user") f=ui.user;	else f=Maggi.UI[ui.type];
	if (f) 
		return f(dom,data,setdata,ui,datachange); 
	else 
		console.log("Maggi.UI: unknown ui.type "+ui.type);
};

//non-object UI handlers
//

Maggi.UI.BaseFunctionality=function(dom,format) {
	var updateClass = function(v, dom, cls) {
		if (v) dom.addClass(cls); else dom.removeClass(cls); 
	}
	var vissethandler=function(k,v) {
		updateClass(v==false,dom,"invisible");
	};
	var backbuilder=null;
	dom.addClass(format.type);
	if (format.popup==true) {
		var triggerElement=dom._MaggiParent.ui[format.popuptrigger];
		var deco=$('<div/>', {'class': "popup-triangle-wrapper"}).appendTo(dom);
		var deco2=$('<div/>', {'class': "popup-triangle-inner"}).appendTo(deco);
		dom.addClass("popup visibilityanimate");

		$(window).resize(place);
		if (dom.mutate) dom.mutate('width height top left right bottom', function(el,info) {
			place();
		});
		if (triggerElement==null) { console.log("Maggi.UI: triggerelement not found."); return; }
		if (triggerElement.mutate) triggerElement.mutate('width height top left right bottom', function(el,info) {
			place();
		});
		triggerElementClick=function() {
			format.visible=!format.visible;
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
			return {left:left,right:right,top:top,bottom:bottom};
		}

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
			deco.css("margin-left",attach.x-left-2*spacing);
		}
		vissethandler=function(k,v) {
			updateClass(v==false,dom,"invisible");
			if (v) { 
				place();
				if (format.popupfocus) {
					var p=dom.ui[format.popupfocus]._Maggi[0];
					p.focus();
					p.select();
				}
			}
		};
		if (!format.hasOwnProperty("visible")) format.add("visible",false); 
		if (format.visible==true) place();
		if (format.visible==false) { dom.addClass("invisible");}
		backbuilder=function() {
			triggerElement.off("click",triggerElementClick);	
			dom.removeClass("popup");
			deco.remove();
		};
	}
	if (format.popup==null) {
		updateClass(format.visible==false,dom,"invisible");
	}
	var sethandler = function(k,v,oldv) {
		if (k=="enabled") updateClass(v,dom,"disabled");
		if (k=="class") { dom.removeClass(oldv); dom.addClass(v); }
	};
	format.bind(["add","set"],"visible",vissethandler);
	format.bind("set",sethandler);
	updateClass(format.enabled==false,dom,"disabled");
	if (format.class) 
		dom.addClass(format.class);
	return function() {
		format.unbind("set",sethandler);
		format.unbind("set",vissethandler);
		dom.removeClass(format.class);
		dom.removeClass(format.type);
		if (backbuilder) backbuilder();
	};
}

Maggi.UI.parentclass=function(dom,s,sets,format) {
	if (!dom._Maggi) {
		var p=dom._MaggiParent;
		p.addClass(s);
		p._Maggi.bind("set",function(k,newv,oldv) { 
			if (k=="state") {
				p.removeClass(oldv);
				p.addClass(newv);
			}
		});
	} 
	dom._Maggi=true;
}

Maggi.UI.text=function(dom,data,sets,ui,onDataChange) {
	//same for all?
	var unbase=Maggi.UI.BaseFunctionality(dom,ui);

	var build=function(data) {
		var s="(null)";
		if (data!=null) { 
			if (ui.format) 
				s=vsprintf(ui.format,[data]) 
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
		if (backbuild_builder) backbuild_builder();
		unbase();
	};
};

Maggi.UI.label=function(dom,data,sets,ui,onDataChange) {
	//same for all?
	var unbase=Maggi.UI.BaseFunctionality(dom,ui);

	var build=function(k,label) {
		dom.text(label);
	};
	ui.bind("set","label",build);
	build("label",ui.label);
	
	//same for all? should be in onDataChange
	var backbuild_builder;
	if (ui.builder) backbuild_builder=ui.builder(dom,data,ui);
	return function() {
		if (backbuild_builder) backbuild_builder();
		ui.unbind(build);
		unbase();
	};
};

Maggi.UI.html=function(ui,s,sets,format) {
	Maggi.UI.BaseFunctionality(ui,format);
	ui.html(s&&s.toString());
};

Maggi.UI.link=function(dom,data,setdata,ui) {
	if (!dom._Maggi) {
		var unbase=Maggi.UI.BaseFunctionality(dom,ui);
		dom._Maggi=$('<a>', {href:data,text:ui.label,target:ui.target}).appendTo(dom);
		var sethandler=function(k,v) {
			if (k=="label") dom._Maggi.text(v);
			if (k=="target") dom._Maggi.attr("target",v);
		};
		ui.bind(sethandler);
		return function() { ui.unbind(sethandler); unbase(); delete dom._Maggi;}
	} else dom._Maggi.attr("href",data);
};

Maggi.UI.image=function(dom,data,setdata,ui,ondatachange) {
	var update = function() {
		var url=data;
		if (ui.urls!=null) url=ui.urls[data];
		img.attr("src",url);
	};
	var unbase=Maggi.UI.BaseFunctionality(dom,ui);
	var img=$('<img>').appendTo(dom);
	dom._Maggi=img;
	ondatachange(update);
	ui.bind("set","urls",update);
	update();
};

Maggi.UI.checkbox=function(ui,v,setv,format) {
	if (!ui._Maggi) {
		Maggi.UI.BaseFunctionality(ui,format);
		var name="maggi_"+Maggi.UI.select.counter.toString(); Maggi.UI.select.counter++;
		var id=name+"_id";
		ui._Maggi=$("<input>",{name:name,id:id,type:"checkbox"}).appendTo(ui).change(function() {
			if (setv) setv(this.checked);
		});
		$("<label>",{for:id,text:format.label}).appendTo(ui);
	} 
	//if (v) ui._Maggi[0].setAttribute("checked","checked"); else ui._Maggi[0].removeAttribute("checked");
	ui._Maggi[0].checked=v;
};

Maggi.UI.input=function(dom,data,setv,format,onChange) {
	var autolength=function(o,v) {
		if (format.autosize) {
			if (v==null) v="";
			v=v.toString();
			var l=v.length;
			if (l==0) o.addClass("empty"); else o.removeClass("empty");
			o.attr("size",l);
		}
	}
	var unbase=Maggi.UI.BaseFunctionality(dom,format);
	dom.empty();
	var prefix=$("<span>",{id:"prefix"}).appendTo(dom);
	var postfix=$("<span>",{id:"postfix"}).appendTo(dom);
	var midfix=$("<span>",{id:"midfix"}).appendTo(dom);
	
	var updatePrefix=function() {
		prefix.text(format.prefix);
	}
	format.bind("set","prefix",updatePrefix);
	updatePrefix();
	
	var updatePostfix=function() {
		postfix.text(format.postfix);
	}
	format.bind("set","postfix",updatePostfix);
	updatePostfix();

	var i=$('<input/>', { type: format.kind, placeholder:format.placeholder }).appendTo(midfix)
	  .on("input",function(event) { 
		autolength(i,this.value);
		setv(this.value);
		event.stopPropagation();
	}).on("keypress",function(event) { 
		if (event.keyCode == '13') { if (format.onReturnKey) format.onReturnKey(this.value); }
		event.stopPropagation();
	}).keydown(function(event) {
		event.stopPropagation();
	}).focus(function() {
		dom.addClass('focused');
	}).blur(function() {
		dom.removeClass('focused');
	});
	format.bind("set","placeholder",i.attr);
	var datachange=function(data) {
		var newvalue=data&&data.toString();
		if (i[0].value!=newvalue) i[0].value=newvalue;
		autolength(i,newvalue);
	};
	onChange(datachange);
	datachange(data);
	dom.click(function() {i.focus();});
	dom._Maggi=i; //deprecated?
	return function() {
		format.unbind("set",i.attr);
		dom._Maggi=null;
		unbase();
	};
};

Maggi.UI.function=function(dom,data,setdata,ui,datachange) {
	var unbase=Maggi.UI.BaseFunctionality(dom,ui);
	var update=function() {
		if (ui.label!=null) dom.text(ui.label);
	};
	update();
	ui.bind("set","label",update);
	dom.click(function() {
		data(dom._MaggiParent._Maggi);
		return false;
	});
	return function() {
		dom.off("click");
		unbase();
	}
};

Maggi.UI.select=function(dom,data,setdata,ui,datachange) {
	var unbase=Maggi.UI.BaseFunctionality(dom,ui);
	var name="maggi_radiogroup_"+Maggi.UI.select.counter.toString(); Maggi.UI.select.counter++;
	var chld={};
	dom._Maggi=chld;
	var style="width:"+(100/Object.keys(ui.choices).length).toString()+"%";
	$.each(ui.choices,function(key,value) {
		var id=name+"_"+key.toString();
		chld[key]=$("<input>",{name:name,id:id,value:key,type:"radio",checked:key==data}).appendTo(dom).change(function() {
			if (this.checked) setdata(key);
		});
		$("<label>",{for:id,text:value.label,style:style}).appendTo(dom);
	});

	datachange(function(data) {
		chld[data].prop('checked', true);
	});

	var formatsethandler=function() {};
	
	ui.bind("set",formatsethandler);

	return function() {
		unbase();
		ui.unbind(formatsethandler);
	};

};

Maggi.UI.select.counter=0;

Maggi.UI.object=function(dom,data,setdata,ui,datachange) {
	var chld={};
	var backbuild={};
	var sethandler={};
	dom.ui=chld;

	//override data
	if (ui.data!=null) data=ui.data;

	var hasExplicitFormat=function(k) {
		if (ui.children) if (ui.children[k]) return true;
		return false;
	};

	var getFormat=function(k) {
		if (hasExplicitFormat(k)) return ui.children[k];
		if (ui.childdefault) return ui.childdefault;
		//console.log("Maggi.UI: default formating.");
		var fmt="text";
		if ((data[k] instanceof Object)&&(!(data[k] instanceof Date))) fmt="object";
		if (((data[k] instanceof Object)&&(!(data[k] instanceof Date))&&(!(typeof data[k] == "function")))&&(fmt.type=="text"||fmt.type=="input")) {
			fmt={type:"object",childdefault:ui.childdefault,makechildlabels:ui.makechildlabels};
		}
		return fmt;
	};
	var update=function(k,v) {
		if (k instanceof Array) return;
		if (sethandler[k]) 
			sethandler[k](v);
	};
	var make=function(k) {
		if (backbuild[k]) 
			backbuild[k]();

		var c=$("<"+(ui.childHTMLElement||"div")+">",{id:k});

		if (ui.makechildlabels) { 
			$("<div>",{"class":"label",text:k}).appendTo(c); 
			c=$("<div>").appendTo(c); 
		}
		c._MaggiParent=dom;  //ugly hack to enable access to parent

		if (chld[k])
			chld[k].replaceWith(c);	
		else 
			c.appendTo(dom); 

		chld[k]=c;
		backbuild[k]=Maggi.UI(chld[k],data[k],getFormat(k),function(v) { 
			data[k]=v; 
		}, function(fn) { 
			sethandler[k]=fn; 
		});
	};
	var add=function(k) {
		if (k instanceof Array) return;
		var shown=true;//data.hasOwnProperty(k);
		if (ui.order) {
			shown=false;
			for (kk in ui.order) if (ui.order[kk]==k) shown=true;
			//if (Object.keys(ui.order).indexOf(k)==-1) shown=false;
		}
		if (ui.childdefault==null) if (ui.hasOwnProperty("children")) if (ui.children[k]==null) shown=false;
		if (!shown) return;
		make(k);
		if (ui.children) ui.children.bind(["add","set","remove"],k,make);
		if (hasExplicitFormat(k)) {
			var ef=ui.children[k];
			if (ef instanceof Object)
				ef.bind("set","type",function(k,v) {
					console.log("type-set");
				});
		}
	};
	var remove=function(k) {
		if (chld.hasOwnProperty(k)) { 
			chld[k].remove(); 
			if (backbuild[k]) {
				backbuild[k](); 
				delete backbuild[k];
			}
			delete chld[k]; 
		}
	};
	var removeall=function() {
		for (var k in chld) remove(k);
	};
	var formatsethandler=function(k,newv,oldv) {
		var hasPropValue = function(o,v) {
			for (var k in o) { if (o[k]==v) return true; }
			return false;
		};
		if (k=="order"||k[0]=="order") {
			if (oldv==null) oldv=Object.keys(chld); 
			$.each(oldv, function(idx,k) { if (!hasPropValue(newv,k)) remove(k); });
			$.each(newv, function(idx,k) { if (chld[k]) chld[k].appendTo(dom); else add(k); });
		}
	};

	var backbuild_builder;
	var backbuild_base;

	var build=function() {
		backbuild_base=Maggi.UI.BaseFunctionality(dom,ui);
		if (data==null||typeof data != "object") return;
		dom._Maggi=data;
		
		if (ui.order) {
			$.each(ui.order, function(idx,v) { add(v); });
		} else if (ui.childdefault) {
			$.each(data, add);
		} else if (ui.hasOwnProperty("children")) {
			if (ui.children) $.each(ui.children, add);
		} else {
			$.each(data, add);
		}
		if (ui.builder) backbuild_builder=ui.builder(dom,data,ui);
		data.bind("set", update);
		data.bind("add", add);
		data.bind("remove", remove);
	};
	
	var backbuild=function() {
		if (backbuild_builder) backbuild_builder();
		if (data) {
			data.unbind("set", update);
			data.unbind("add", add);
			data.unbind("remove", remove);
		}
		if (backbuild_base) backbuild_base();
		removeall();
		dom._Maggi=null;
	};

	var rebuild=function(newdata) {
		backbuild();
		data=newdata;
		build();
	};
	
	ui.bind("set",formatsethandler);
	
	if (datachange) datachange(rebuild);
	build();

	return function() {
		backbuild();
		ui.unbind(formatsethandler);
	};
};

Maggi.UI.tabs=function(ui,o,seto,format) {
	if (o==null) {ui.empty(); return; }
	if (!(ui._Maggi===o)) {
		Maggi.UI.BaseFunctionality(ui,format);
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

Maggi.UI.list=function(dom,data,setdata,ui,datachange) {
	var chld={};
	var installClick = function(k,v) {
		if (ui.select=="single"||ui.select=="multi")
			v.click(function() { select(k) }); 
	};
	var select=function(k) {
		if (ui.select=="single") ui.selected=k;
		else ui.selected.add(k,!ui.selected[k]);
	};
	var updateSingleSelection = function(newv,oldv) {
		if (oldv) if (chld[oldv]) chld[oldv].removeClass("selected");
		if (newv) if (chld[newv]) chld[newv].addClass("selected");
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
		if (backbuild_base) backbuild_base();
		if (backbuild_header) backbuild_header();
		dom._Maggi=null;
	};

	var rebuild=function(newdata) {
		backbuild();
		data=newdata;
		build();
	};
	
	ui.bind("set",formatsethandler);
	
	if (datachange) datachange(rebuild);
	build();

	return function() {
		backbuild();
		ui.unbind("set",formatsethandler);
	};



};

