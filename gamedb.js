function GameDatabase(){
	this.acc = 1;
	this.objects = {};
}
GameDatabase.prototype.equip = function(global_id,child_id,unequip){
	var obj = this.objects[global_id];
	if(obj){
		obj.equip(child_id,unequip);
	}
}
GameObject.prototype.equip = function(child_id,unequip){
	var child = this.Get(child_id);
	//console.info('equip',unequip,child);
	if(child){
		if(!unequip){
			child.attr_remove({
				name  : GAME_CONST_ACTIVE,
				value : GAME_CONST_PERMANENT
			});
			if(this.active[child.id]) delete this.active[child.id];
		}else{
			child.attr_add({
				name  : GAME_CONST_ACTIVE,
				value : GAME_CONST_PERMANENT
			});
			this.active[child.id] = GAME_CONST_PERMANENT;
		}
	}
	this.update();
}
GameDatabase.prototype.ATTR = function(child_id){
	var arr = [];
	if(this.objects[child_id]){
		var all = this.objects[child_id].ATTR();
		for(var name in all){
			arr.push({
				name : name,
				value : all[name]
			});
		}
	}
	return arr;
}
GameDatabase.prototype.included = function(arr,child_id){
	var f = {};
	f[child_id] = 1;
	
	for(var id in arr){
		if(arr[id].included(f)) return true;
	}
	return false;
}
GameDatabase.prototype.parents = function(child_id){
	var arr = {};
	var f = {};
	f[child_id] = 1;
	for(var global_id in this.objects){
		if(global_id!=child_id){
			var obj = this.objects[global_id];
			if(obj.included(f)) arr[global_id]=obj;
		}
	}
	return arr;
}
GameDatabase.prototype.child_remove = function(obj,global_id){
	var Owner = this.objects[obj.global_id];
	var child = Owner ? Owner.find(global_id) : [];
	if(Owner && child.length){
		for(var i=0;i<child.length;i++)
			Owner.obj_remove(child[i]);
		
		// update all parents of Owner
		this.updateOwner(Owner);
	}
}
GameDatabase.prototype.child_add = function(obj,global_id){
	var Owner = this.objects[obj.global_id];
	var child = this.objects[global_id];
	if(Owner && child){
		var conf = child.config();
		conf.id = false;
		Owner.obj_add(conf);
		
		// update all parents of Owner
		this.updateOwner(Owner);
	}
}
GameDatabase.prototype.updateOwner = function(Child){
	var child_id = Child.global_id;
	var conf = Child.config();
	for(var global_id in this.objects){
		if(global_id!=child_id){
			this.objects[global_id].child_update(conf);
		}
	}
};
GameDatabase.prototype.children_not = function(owner,target){
	var arr = [];
	if(target){
		arr = target();
		target.removeAll();
	}
	var find_id = owner.global_id;
	
	var Owner = this.objects[find_id];
	var Children = Owner.GetChildren();
	/*
	console.info('Children',{
		all : this.objects,
		child : Children
	});
	*/
	var Parents = this.parents(find_id);
	for(var global_id in this.objects){
		if(global_id==find_id || Children[global_id] || Parents[global_id]) continue;
		var obj = this.objects[global_id];
		//console.info('children_not',find_id,obj.attrValue(GAME_CONST_NAME));
		if(this.included(Children,find_id)) continue;
		if(this.included(Parents,global_id)) continue;
		arr.push( {
				global_id : global_id,
				name : obj.attrValue(GAME_CONST_NAME),
				active : obj.attrValue(GAME_CONST_ACTIVE)==GAME_CONST_PERMANENT,
				avatar : obj.attrValue(GAME_CONST_AVATAR)
		});
	}
	if(target)
		target.valueHasMutated();
}
GameDatabase.prototype.children = function(obj,target){
	var arr = [];
	if(target){
		arr = target();
		target.removeAll();
	}
	var Owner = this.objects[obj.global_id];
	var all = Owner.GlobalChildren();
	for(var global_id in all){
		var obj = all[global_id];
		if(obj){
			if(target){
				arr.push( {
						global_id : global_id,
						name : obj.attrValue(GAME_CONST_NAME),
						active : ko.observable(obj.attrValue(GAME_CONST_ACTIVE)==GAME_CONST_PERMANENT),
						avatar : obj.attrValue(GAME_CONST_AVATAR),
						data : obj
				});
			}else{
				arr.push( {
						global_id : global_id,
						name : obj.attrValue(GAME_CONST_NAME),
						active : obj.attrValue(GAME_CONST_ACTIVE)==GAME_CONST_PERMANENT,
						avatar : obj.attrValue(GAME_CONST_AVATAR),
						data : obj
				});
			}
		}
	}
	//console.info('children',all,arr);
	if(target)
		target.valueHasMutated();
}
GameDatabase.prototype.get = function(global_id){
	var obj = this.objects[global_id];
	return {
		global_id : global_id,
		name : obj.attrValue(GAME_CONST_NAME),
		active : obj.attrValue(GAME_CONST_ACTIVE)==GAME_CONST_PERMANENT,
		avatar : obj.attrValue(GAME_CONST_AVATAR)
	}
};
GameDatabase.prototype.config = function(data){
	if(data){
		// load
		for(var i=0;i<data.objects.length;i++){
			this.load(data.objects[i].data);
		}
		this.acc = data.acc;

	}else{
		var arr = [];
		for(var global_id in this.objects){
			arr.push({
				obj_id : global_id,
				data : this.objects[global_id].config()
			});
		}
		
		return {
			acc : this.acc,
			objects : arr
		};
	}
};
GameDatabase.prototype.Objects = function(target){
	var arr = [];
	if(target){
		arr = target();
		target.removeAll();
	}
	
	for(var global_id in this.objects){
		var obj = this.objects[global_id];
		arr.push({
			global_id : global_id,
			name : obj.attrValue(GAME_CONST_NAME),
			active : obj.attrValue(GAME_CONST_ACTIVE),
			avatar : obj.attrValue(GAME_CONST_AVATAR)
		});
	}
	if(target)
		target.valueHasMutated();

	//console.info('Objects',arr,this.objects);

}
GameDatabase.prototype.Attributes = function(global_id,target){
	var obj = this.objects[global_id];
	target.removeAll();
	if(obj)	obj.Attributes(target());
	target.valueHasMutated();
}
GameDatabase.prototype.clone = function(item){
	//console.info('clone',item,this.objects);
	if(this.objects[item.global_id]){
		var conf = this.objects[item.global_id].config();
		conf.global_id = this.acc++;
		this.load(conf);
	}
}
GameDatabase.prototype.load = function(conf){
	var global_id = conf.global_id;
	var obj = new GameObject(global_id);
	this.objects[global_id] = obj;
	obj.load(conf);
	//console.info('load',conf,this.objects);
};
GameDatabase.prototype.remove = function(item){
	if(this.objects[item.global_id])
		delete this.objects[item.global_id];
}
GameDatabase.prototype.change = function(item,attr){
	if(item.id){
		// child object - direct access
		item.attr_add(attr);
		item.update();
	}else{
		var obj = this.objects[item.global_id];
		//console.warn('change',typeof(item),item,attr);
		if(obj){
			obj.attr_add(attr);
			obj.update();
		}
	}	
}
GameDatabase.prototype.remove_attr = function(item,attr){
	var obj = this.objects[item.global_id];
	if(obj){
		obj.attr_remove(attr);
		obj.update();
	}
}
GameDatabase.prototype.copy = function(item,attr){
	var obj = this.objects[item.global_id];
	if(obj){
		attr.name += '_copy';
		obj.attr_add(attr);
	}
}
GameDatabase.prototype.add = function(name){
	var global_id = this.acc++;
	var obj = new GameObject(global_id);
	this.objects[global_id] = obj;
	obj.attr_add({
		name  : GAME_CONST_NAME,
		value : name
	});
}