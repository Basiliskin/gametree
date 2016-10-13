var GAME_CONST_PERMANENT = 999999;
var GAME_CONST_ACTIVE = '$active';
var GAME_CONST_NAME = 'name';
var GAME_CONST_AVATAR = '$avatar';

function GameObject(global_id,root){
	this.died = false;
	this.global_id = global_id || 0;
	this.id = 0;
	this.acc = 1;
	this.root = root;
	this.allATTR = {};
	this.attr = {};
	this.nattr = {};
	this.active = {};
	this.object = {};
	this.func = {
		'tick'	:[],// each loop not on update
		'before':[],// on update
		'after'	:[] // on update
	};
};
GameObject.prototype.ATTR = function(){
	return this.allATTR;
};
GameObject.prototype.GlobalAttribute = function(){
	var all = {};
	for(var id in this.attr){
		var attr = this.attr[id];
		all[attr.conf.name] = attr.conf.value;
	}
	//console.info('GlobalAttribute',this.global_id,all,this.active);
	for(var obj_id in this.active){
		var attrs = this.object[obj_id].allATTR;
		//console.info('GlobalAttribute',obj_id,attrs);
		for(var attr_name in attrs){
			switch(attr_name){
				case GAME_CONST_ACTIVE:
				case GAME_CONST_AVATAR:
				case GAME_CONST_NAME:
					break;
				default:
					if(!all[attr_name])
						all[attr_name] = attrs[attr_name];
					else
						all[attr_name] += attrs[attr_name];
					break;
			}
		}
	}
	return all;
};
GameObject.prototype.Attributes = function(arr){
	for(var id in this.attr)
		arr.push(this.attr[id].config());
};
GameObject.prototype.GetAttributes = function(){
	var arr = [];
	for(var id in this.attr)
		arr.push(this.attr[id].config());
	return arr;
};

GameObject.prototype.config = function(){
	if(this.died) return null;
	// return object config
	var config = {
		id : this.id,
		global_id : this.global_id,
		acc : this.acc,
		items : []
	};
	var arr = [];
	for(var id in this.attr){
		arr.push({
			t : 'a',
			d : this.attr[id].config()		
		});
	}
	for(var id in this.object){
		var d = this.object[id].config();
		if(d){
			arr.push({
				t : 'o',
				d : d
			});
		}
	}
	config.items = arr;
	return config;
};
GameObject.prototype.find = function(global_id,all){
	var arr = all || [];
	for(var id in this.object){
		var obj = this.object[id];
		if(global_id==obj.global_id)
			arr.push(id);
		else
			obj.find(global_id,arr);
	}
	return arr;
}
GameObject.prototype.Get = function(global_child_id){
	for(var id in this.object){
		var obj = this.object[id];
		if(global_child_id==obj.global_id)
			return obj;
	}
}
GameObject.prototype.included = function(children){
	for(var id in this.object){
		var obj = this.object[id];
		if(children[obj.global_id]) return true;
		if(obj.included(children)) return true;
	}
	return false;
}
GameObject.prototype.load = function(config){
	this.acc = config.acc;
	this.global_id = config.global_id;
	this.id = config.id;
	this.attr = {};
	this.nattr = {};
	this.active = {};
	this.object = {};
	this.changed = true;
	var hook = {
		a : this.attr_add.bind(this),
		o : this.obj_add.bind(this)
	}
	for(var i=0;i<config.items.length;i++){
		var item = config.items[i];
		hook[item.t](item.d);
	}
	this.update();
	//console.info('GameObject.load',config,this);
};
GameObject.prototype.GlobalChildren = function(){
	var arr = {};
	
	for(var id in this.object){
		var obj = this.object[id];
		arr[obj.global_id] = obj;
	}
	return arr;
}
GameObject.prototype.GetChildren = function(all){
	var arr = all || {};
	//arr[this.global_id] = this;
	for(var id in this.object){
		var obj = this.object[id];
		arr[obj.global_id] = obj;
		obj.GetChildren(arr);
	}
	return arr;
}
GameObject.prototype.child_update = function(conf){
	for(var id in this.object){
		var obj = this.object[id];
		if(obj.global_id==conf.global_id){
			conf.id = id;
			this.obj_add(conf);
		}else{
			obj.child_update(conf);
		}
	}
}
GameObject.prototype.obj_add = function(conf){
	var obj = new GameObject(conf.global_id,this.root || this);
	obj.load(conf);
	obj.id = obj.id || this.acc++;
	this.object[obj.id] = obj;
	var expire = obj.expired_at();
	if(expire){
		this.obj_activate(obj.id,expire);
	}
	this.changed = true;
	//console.warn('obj_add',conf);
};
GameObject.prototype.obj_remove = function(obj_id){
	if(this.object[obj_id]){
		if(this.active[obj_id]){
			this.changed = true;
			delete this.active[obj_id];
		}
		delete this.object[obj_id];		
	}
};
GameObject.prototype.expired_at = function(){
	return this.nattr[GAME_CONST_ACTIVE] ? this.attr[this.nattr[GAME_CONST_ACTIVE]].value() : false;
};
GameObject.prototype.obj_activate = function(obj_id,expire){
	expire = expire || this.object[obj_id].expired_at();
	if(!expire || expire<0){
		if(this.active[obj_id]) delete this.active[obj_id];
		delete this.object[obj_id];
		this.changed = true;
	}
	else if(!this.active[obj_id]){
		this.object[obj_id].attr_add({
			name  : GAME_CONST_ACTIVE,
			value : expire
		});
		this.active[obj_id] = expire;
	}
};
GameObject.prototype.attr_value = function(name,value,skip){
	if(value){
		if(this.nattr[name]){
			this.attr[this.nattr[name]].setValue(value);
		}
	}else if(this.nattr[name]){
		var v = this.attr[this.nattr[name]].value();
		if(!skip)
			for(var obj_id in this.active)
				v += this.object[obj_id].attr_value(name);
		return v;
	}else if(this.root){
		return this.root.attr_value(name,false,true);
	}
};
GameObject.prototype.attrValue = function(name){	
	var v = this.nattr[name] ? this.attr[this.nattr[name]].value() : '';
	//console.warn('attrValue',name,v);
	return v;
};
GameObject.prototype.attr_list = function(){
	var arr = [];
	for(var name in this.nattr){
		arr.push(this.attr[this.nattr[name]].config());
	}
	return arr;
};
GameObject.prototype.attr_add = function(data,isNew){
	//console.info('attr_add',data);
	if(data && this.nattr[data.name]){
		//console.info('attr_add',this.nattr[data.name],this.attr,data);
		this.attr[this.nattr[data.name]].update(data);
	}else{
		var attr = new GameAttribute(this,data);
		this.attr[attr.id] = attr;
		this.nattr[attr.conf.name] = attr.id;
	}
	
	this.changed = true;
};
GameObject.prototype.attr_remove = function(data){
	if(this.nattr[data.name]){
		delete this.attr[this.nattr[data.name]];
		delete this.nattr[data.name];
		this.changed = true;
	}
}
GameObject.prototype.getUid = function(){ return this.acc++;};

GameObject.prototype.tick = function(){
	if(!this.died && this.nattr[GAME_CONST_ACTIVE]){
		var v = this.attr[this.nattr[GAME_CONST_ACTIVE]];
		if(v!=GAME_CONST_PERMANENT){
			this.attr[this.nattr[GAME_CONST_ACTIVE]].setValue(v - 1);
			if(v-1<=0){
				// died
				this.died = true;
			}
		}
	}	
	if(!this.died){
		this.update_attributes(this.func['tick']);
		this.allATTR = this.GlobalAttribute();
	}
};
GameObject.prototype.update = function(){
	// update active children
	console.info('update',this.global_id,this.active);
	for(var obj_id in this.active){
		this.object[obj_id].update();
		this.obj_activate(obj_id);
	}
	// recompile functions
	if(this.changed) this.register();
	
	this.update_attributes(this.func['before']);
	this.update_attributes(this.func['after']);
	
	this.allATTR = this.GlobalAttribute();
	
};
GameObject.prototype.register = function(){
	if(this.changed){
		this.changed = false;
		this.func = {
			'tick'	:[],
			'before':[],
			'after':[]	
		};
		for(var i in this.attr)	this.attr[i].register();
	}
};
function GameFuncion(conf){
	this.func = null;
	this.args = [];
	this.code = '';
	this.type = '';//min,max,value
	this.target = '';//tick,before,after
	this.parse(conf);
};
function GameAttribute(owner,conf){
	this.id = conf.id || owner.getUid();
	this.conf = conf;
	this.owner = owner;
	this.Func = null;// recompile 
};
GameAttribute.prototype.update = function(conf){
	this.conf.value 	= conf.value 	|| this.conf.value;
	this.conf.formula 	= conf.formula 	|| this.conf.formula;
	this.conf.params 	= conf.params 	|| this.conf.params;
	this.conf.min 		= conf.min 		|| this.conf.min;
	this.conf.max 		= conf.max 		|| this.conf.max;
	this.Func = null;// recompile 
};
GameAttribute.prototype.value = function(){
	return this.conf.value;
};
GameAttribute.prototype.config = function(){
	this.conf.id = this.id;
	return  $.extend({min:'',max:''}, this.conf);
};
GameAttribute.prototype.setMin = function(value){
	this.conf.min = value;
	//console.info('setMin',this.conf);
};
GameAttribute.prototype.setMax = function(value){
	this.conf.max = value;
	//console.info('setMax',this.conf);
};
GameAttribute.prototype.setValue = function(value){
	if(value==0)
		this.conf.value 	= value;
	if(this.conf.min && this.conf.min>value)
		this.conf.value 	= this.conf.min;
	else if(this.conf.max && this.conf.max<value)
		this.conf.value 	= this.conf.max;
	else
		this.conf.value 	= value;
	//console.info('setValue',this.conf);
}
GameAttribute.prototype.register = function(){
	if(!this.Func && this.conf.formula && this.conf.params){
		this.Func = new GameFuncion(this.conf);
	}
	this.owner.RegisterAttrFunc(this);
};
GameFuncion.prototype.parse = function(conf){
	var arr = [];
	var formula = conf.formula, params = conf.params;
	var list = params.split('|');
	if(list.length>2){
		var code = 'return '+formula+';';
		this.type = list[1];
		this.target = list[0];
		for(var i=2;i<list.length;i++){
			var arg = list[i].split('=');
			if(arg.length==2){
				var new_name = arg[0].replaceAll('@','');
				code = ''+code.replaceAll(arg[0],'this["'+new_name+'"]');
				var set = { name : new_name };
				var a = arg[1].split('[');
				if(a.length==2){
					set.object = a[0];
					set.attribute =  a[1].split(']')[0];
				}else{
					set.constant = arg[1];
				}
				arr.push(set);
			}
		}
		this.args = arr;
		this.func = new Function(code);
		//console.info('GameFuncion.prototype.parse',arr,code);
	}
};

GameFuncion.prototype.exec = function(owner){
	if(!this.func) return ;

	var args = this.args;
	var that = {  };
	for(var i=0;i<args.length;i++){
		args[i].value = args[i].constant;
		if(!args[i].value){
			args[i].value = owner.attr_value(args[i].attribute);
		}
		that[args[i].name] = parseFloat(args[i].value);
		if(isNaN(that[args[i].name])) that[args[i].name] = args[i].value;
	}
	var v = this.func.call(that);
	//console.info('GameFuncion.prototype.exec',this.args,that,v);
	return v;
}
GameObject.prototype.RegisterAttrFunc = function(attr){
	var func = attr.Func;
	//console.info('GameObject.prototype.RegisterAttrFunc',func);
	if(func && this.func[func.type]){
		var c = func.target=='min' ? attr.setMin.bind(attr) : func.target=='max' ? attr.setMax.bind(attr) : attr.setValue.bind(attr);
		//console.info('GameObject.prototype.RegisterAttrFunc',attr);
		this.func[func.type].push({
			a : attr.id,
			f : func,
			c : c
		});
	}else{
		// error
	}
};
GameObject.prototype.update_attributes = function(list){
	for(var i=0;i<list.length;i++){
		var f = list[i];
		if(this.attr[f.a]){
			//console.info('update_attributes',f);
			f.c(f.f.exec(this));
		}		
	}
};