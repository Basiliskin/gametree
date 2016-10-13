String.prototype.trunc = String.prototype.trunc ||
  function(n){
	  return (this.length > n) ? this.substr(0,n-1)+'...' : this;
  };
	  
String.prototype.replaceAll = function(searchStr, replaceStr) {
	var str = this;

    // no match exists in string?
    if(str.indexOf(searchStr) === -1) {
        // return string
        return str;
    }

    // replace and remove first match, and do another recursirve search/replace
    return (str.replace(searchStr, replaceStr)).replaceAll(searchStr, replaceStr);
}
function parseParams(params){
	var arr = [];
	var list = params.split('|');
	for(var i=0;i<list.length;i++){
		var arg = list[i].split('=');
		if(arg.length==2){
			var set = { name : arg[0]};
			var a = arg[1].split('[');
			if(a.length==2){
				set.object = a[0];
				set.attribute =  a[1].split(']')[0];
			}else{
				set.value = arg[1];
			}
			arr.push(set);
		}
	}
	return arr;
};
function CallFunction(formula,params){
	var code = 'return '+formula+';';
	var that = {  };
	for(var i=0;i<params.length;i++){
		var new_name = params[i].name.replaceAll('@','');
		code = ''+code.replaceAll(params[i].name,'this["'+new_name+'"]');			
		that[new_name] = parseFloat(params[i].value);
		if(isNaN(that[new_name])) that[new_name] = params[i].value;
	}
	//console.info('CallFunction',code,that);
	var result = new Function(code).call(that);
	//console.info('CallFunction',that,result);
	return result;
};
(function(Date) {
if (!Date.prototype.toStr) {
	Date.prototype.toStr = function() {
		function pad(n) {
			return n < 10 ? '0' + n : n;
		}
		return pad(this.getUTCDate()) +'/'+ pad(this.getUTCMonth() + 1) + ' ' + pad(this.getUTCHours()) + ':' + pad(this.getUTCMinutes());
	};
}
}(Date));



function GameClass(conf){
	this.avatar = ko.observable();
	this.stack = {};
	this.config = {
		id : 1,
		dic : {},
		object : {},
		types : {},
		attr  : {}
	};
	if(conf.object){
		this.SetConfig(conf);
	}else{
		this.add({name : 'avatar',		description:'',type:'attribute',value:''});
		this.add({name : 'type',		description:'',type:'attribute',value:conf.type});
		this.add({name : 'name',		description:'',type:'attribute',value:conf.name});
		this.add({name : 'description',	description:'',type:'attribute',value:conf.description});			
	}
};
GameClass.prototype.SetConfig = function(set){
	this.id = set.id;
	this.config = {
		id : 1,
		object : [],
		types : {},
		attr  : {},
		dic : {}
	};
	var list = set.object;
	for(var i=0;i<list.length;i++){
		var item = list[i];
		if(item.t==0){
			this.add(item.d);
		}else{
			var obj = new GameClass(item.d);
			this.add(obj);
		}
	}
	
	this.config.id = set.uid;
};
GameClass.prototype.GetConfig = function(is_new){
	var arr = [];
	var list = this.config.object;
	for(var i in  list){
		var item = list[i];
		//console.info('GetConfig',i,item,typeof(item));
		if(item.config){
			arr.push({
				t : 1,
				d : item.GetConfig()
			});
		}else{
			arr.push({
				t : 0,
				d :  $.extend({}, item)
			});
		} 
		
	}
	return {
		id : is_new ? false : this.id,
		uid : this.config.id,
		object : arr
	}
};
GameClass.prototype.new_id = function(){
	return this.config.id++;
};
GameClass.prototype.getAttribute = function(name){
	var id = this.config.attr[name];
	var v ;
	if(id){
		v = this.config.object[id].value;
	}
	
	return v;
};
GameClass.prototype.setAttribute = function(name,value){
	var id = this.config.attr[name];
	if(id){
		this.config.object[id].value  = value;
		if(name=='avatar') this.avatar(value);
	}else{
		this.add({name : name,		description:'',type:'attribute',value:value});
	}
};
GameClass.prototype.GetAttributes = function(set){

	for(var name in this.config.attr){
		if(name!='avatar' && name!='type' && !set.hash[name]){
			set.hash[name] = 1;
			set.items.push({
				title : name
			});
		}
	}
	var list = this.config.object;
	for(var id in list){
		//console.info('GetAttributes',this,id,typeof(list[id].GetAttributes));
		if(typeof(list[id].GetAttributes)=='function')
			list[id].GetAttributes(set);
	}
};
GameClass.prototype.GetAttribute = function(name){
	var id = this.config.attr[name];
	if(id)
		return this.config.object[id];
};
GameClass.prototype.getType = function(obj,target,filter){
	
	var list = this.config.types[obj.type];
	var arr = [];
	if(target){
		target.removeAll();
		arr = target();
	}
	//console.info('getType',obj.type,this.config.types,list);
	if(list){
		for(var i in list){
			var id = list[i];
			var item = this.config.object[id];
			if(!filter || filter(item)) 
				arr.push(item);
		}
	}
	if(target){
		target.valueHasMutated();
	}
	//console.info('getType',obj.type,this.config.types,arr);
	return arr;
};
GameClass.prototype.find = function(name){
	if(this.config.dic[name]){
		for(var id in this.config.dic[name])
			return [this.config.object[id]];
	}
	
	var arr = [];
	for(var id in this.config.object){
		if(typeof(this.config.object[id].GetAttribute)=='function')
			arr.push(this.config.object[id]);
	}
	//console.info('find',name,arr);
	return arr;
};
GameClass.prototype.getTypes = function(exclude,target){
	var arr = [];
	if(target){
		target.removeAll();
		arr = target();
	}

	for(var i in this.config.types){
		arr.push({
			name : i
		});
	}

	if(target){
		target.valueHasMutated();
	}
};
GameClass.prototype.remove = function(obj){
	delete this.config.object[obj.id];
	if(this.config.types[obj.type]){
		delete this.config.types[obj.type][obj.id];
	}
	switch(obj.type){
		case 'attribute':
			delete this.config.attr[obj.name];
			break;
		default:
			var name = obj.getAttribute('name');
			if(this.config.dic[name]){
				delete this.config.dic[name][obj.id];
			}
			break;
	}			
	
};
GameClass.prototype.add = function(obj){
	obj.id = obj.id || this.new_id();
	//console.info('add',obj);
	this.config.object[obj.id] = obj;
	//console.info('add',obj);
	if(!this.config.types[obj.type]){
		this.config.types[obj.type] = {};
	}
	this.config.types[obj.type][obj.id] = obj.id;
	switch(obj.type){
		case 'attribute':
			this.config.attr[obj.name] = obj.id;
			if(obj.name=='type') this.type = obj.value;
			else if(obj.name=='avatar'){
				this.avatar(obj.value);
				//console.info('avatar',this.avatar());
			} 
			break;
		default:
			var name = obj.getAttribute('name');
			if(!this.config.dic[name]) this.config.dic[name] = {};
			this.config.dic[name][obj.id] = obj.id;
			break;
	}
};
GameClass.prototype.makeClone = function(){		
	return new GameClass(this.GetConfig(true));
};
GameClass.prototype.copy = function(obj){
	var clone = obj.makeClone();		
	this.add(clone);
};

GameClass.prototype.calculate = function(item,stack){
	var formula = item.formula,params = item.params;
	var v ;
	stack = stack || 1;
	if(stack>10) return;
	var root = this;
	if(stack==1){
		this.stack = {};
	}
	var query = this.stack;
	var args = parseParams(params);
	//console.info('calculate',args);
	for(var i=0;i<args.length;i++){
		if(!args[i].value){
			var sum = 0;
			var obj = root.find(args[i].object);
			for(var j=0;j<obj.length;j++){
				var attr = obj[j].GetAttribute(args[i].attribute);
				var value = 0;
				if(attr){
					if(attr.formula && attr.params){
						var aid = obj[j].id+'.'+attr.id;
						if(!query[aid]){
							query[aid] = true;
							value = root.calculate(attr,stack+1);
							query[aid] = value;
						}else{
							value = query[aid];
						}
					}else if(attr.value){
						value = parseFloat(attr.value);	
						if(isNaN(value)) value = attr.value;
					}
					sum += value;
				}
			}
			args[i].value = sum;
		}
	}
	v = CallFunction(formula,args);			
	console.info('calculate',v,formula,params);
	return v;
};