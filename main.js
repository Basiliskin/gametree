	/*
	
	http://caragulak.nsupdate.info/proj/gametree/index.html 
	
	avatar:
	manage: db,
	find by attribute value
	
	*/
function _resize(img, maxWidth, maxHeight){
    var ratio = 1;
    var canvas = document.createElement("canvas");
    canvas.style.display="none";
    var ctx = canvas.getContext("2d");

   
	
	canvas.width = maxWidth;
	canvas.height = maxHeight;

	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	var dataURL = canvas.toDataURL("image/png");

	return dataURL;
};
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
	var db = new ArrayDB();
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
	function zipData(files,onfinish,name){
		// create div = data;
		var zip = new JSZip();
		for(var i=0;i<files.length;i++){
			var file = files[i];
			switch(file.type){
				case 'json':
					zip.file(file.name, JSON.stringify(file.content));
					break;
				default:
					zip.file(file.name,file.content);
					break;
			}
		}
		
		zip.generateAsync({compression:'DEFLATE',type:"blob"}).then(function (blob) {
			saveAs(blob, (name ? name : 'game_tree_')+new Date().toStr()+'.zip');
			if(onfinish) onfinish();
		});
	}
	ko.bindingHandlers.ko_autocomplete = {
		init: function (element, params) {
			$(element).autocomplete(params());
		},
		update: function (element, params) {
			$(element).autocomplete("option", "source", params().source);
		}
	};
	
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
	
	var MainModel = function() {
		var self = this;
		var templates = {};

		var DataBase = new GameClass({
			name : 'db',
			description : 'data base'
		});
		self.Error = ko.observable();
		var test = parseParams('@a@=a1[value]|@b@=100|@c@=0.5');
		
		var result = CallFunction('@b@*@c@',test);
		self.current = null;
		self.Types = ko.observableArray([]);
		self.Attributes = ko.observableArray([]);
		self.SearchAttribute = ko.observableArray([]);
		self.SearchName = ko.observable();
		self.chosenAttribute = ko.observable();
		
		self.Objects = ko.observableArray([]);
		self.cMode = ko.observable();
		self.Attribute = {};
		self.selected = ko.observable();
		var loading = false;
		var selected;
		var searchData = {
			txt : '',
			attr : ''
		};
		function init(){
			$(".upload_image").on('change', function () {
				if (typeof (FileReader) == "undefined") {
					 alert("This browser does not support FileReader.");
					 return;
				}
				var pattr = $(this).attr('xattr').split(',');
				var previewImage = new Image();
				var countFiles = $(this)[0].files.length>0 ? 1 : 0;
				var imgPath = $(this)[0].value;
				var extn = imgPath.substring(imgPath.lastIndexOf('.') + 1).toLowerCase();
				
				for(var i=1;i<pattr.length;i++){
					if(extn==pattr[i]){
						var reader = new FileReader();
						reader.onload = function (e) {
							
							var maxx = 120;
							var maxy = 120;
							previewImage.src = e.target.result; 
							var k = _resize(previewImage, maxx, maxy);
							previewImage.src = k;
							if(selected){
								selected.setAttribute('avatar',k);
							}
						}

						reader.readAsDataURL($(this)[0].files[0]);
					}
				}
			});
			self.ChangeAvatar = function(item){
				selected = item;
				$('#fileUpload').click();
			};
			
			self.search = function(text,attribute){
				if(text && attribute){
					searchData.txt = text;
					searchData.attr = attribute[0];
				}else{					
					searchData.txt = '';
					searchData.attr = '';
				}
				self.refresh();
			}
			self.searchBy = function(model,event){
				switch(event.type){
					case 'change':
						self.search(self.SearchName(),self.chosenAttribute());
						//console.info('searchBy',self.SearchName(),self.chosenAttribute());
						break;
					case 'keypress':
						if(event.keyCode === 13){
							var key = event.target.value;
							/*
							ko.tasks.schedule(function () {
							   BookData.search(key);
							});
							*/
							self.search(self.SearchName(),self.chosenAttribute());
						}else{
							return true;
						}
						break;
				}
				
			};
			self.GetAttributeList = function(){
				self.SearchAttribute.removeAll();
				var arr = {
					hash : {},
					items : self.SearchAttribute()
				};
				DataBase.GetAttributes(arr);
				self.SearchAttribute.valueHasMutated();
			};
			self.GetAvatar = function(item) {
				if(item) return item.getAttribute('avatar');
			};//ko.computed();
			self.GetValue = function(item){
				
				if(item.formula && item.params){
					//console.info('GetValue',item);
					return DataBase.calculate(item);
				}
				if(item.value)
					return item.value;
			};
			self.RemoveSelected = function(item){
				if(!item || loading) return;
				//console.info('RemoveSelected',item);
				loading = true;
				selected = null;
				self.selected(false);
				self.Attributes.removeAll();
				self.Types.removeAll();

				DataBase.remove(item);
				loading = false;
				self.refresh();
			};
			self.CopySelected = function(item){
				if(!item || loading) return;
				//console.info('CopySelected',item);
				loading = true;
				self.selected(false);
				selected = null;
				DataBase.copy(item);
				loading = false;
				self.refresh();
			};
			self.RemoveAttribute = function(attr){
				if(!selected || loading || !attr) return;
				selected.remove(attr);
				self.SelectObject();
			};
			self.EditAttribute = function(attr,item){
				if(loading) return;

				if(item){
					selected = item;
				}
				if(!attr){
					attr = {
						name : '',
						description : '',
						value : '',
						type : 'attribute',
						formula : '',
						params : ''
					};
				}
				//console.info('EditAttribute',self.selected,attr,item);
				self.cMode(attr.type);
				self.SaveIfChanged();
				self.current = attr;
				self.GetAttribute('name',attr.name,true);
				self.GetAttribute('description',attr.description,true);
				self.GetAttribute('value',attr.value,true);
				self.GetAttribute('formula',attr.formula,true);
				self.GetAttribute('params',attr.params,true);
				self.ShowDialog('object_attribute');
			};
			self.canEdit = function(type){
				switch(type){
					case 'type': 
					case 'avatar': 
						return false;
						break;
				}
				return true;
			};
			self.SelectObject = function(item){
				loading = true;
				//console.info('SelectObject',item);
				selected = item || selected;
				if(selected){
					selected.getType({type:'attribute'},self.Attributes);
					selected.getTypes([],self.Types);
					self.selected(selected.id);
				}else{
					self.Attributes.removeAll();
					self.Types.removeAll();
					self.selected(false);
				}
				loading = false;
			};
			self.refresh = function(){		
				loading = true;
				self.Attributes.removeAll();
				self.Types.removeAll();
				self.GetAttributeList();

				DataBase.getType({
					type : 'character'
				},self.Objects,function(obj){
					if(searchData.attr!='' && searchData.txt!='' ){
						var v = obj.getAttribute(searchData.attr);
						if(v && v.indexOf(searchData.txt)>=0) return true;
						return false;
					}
					return true;
				});
				loading = false;
			};
			self.GetAttribute = function(name,value,set){
				if(!self.Attribute[name]) self.Attribute[name] = ko.observable(value);
				if(set){
					self.Attribute[name](value);
				}
				return self.Attribute[name]();
			};
			self.SaveIfChanged = function(){
				if(self.current){
					
				}
			};
			self.isNew = function(){
				return !self.current.id;
			};
			self.SaveDialog = function(model,event){
				
				self.CloseDialog();
				self.current.type = self.current.type || self.cMode();
				switch(self.current.type){
					case 'attribute':
						self.current.name = self.GetAttribute('name');
						self.current.description = self.GetAttribute('description');
						self.current.value = self.GetAttribute('value');
						self.current.formula = self.GetAttribute('formula');
						self.current.params = self.GetAttribute('params');
						
						console.info('SaveDialog',selected,self.current);
						selected.add(self.current);

						if(self.current.name=='name') self.refresh();

						self.SelectObject();
						
						break;
					case 'character':
						loading = true;
						self.current.name = self.GetAttribute('name');
						self.current.description = self.GetAttribute('description');
						
						self.current = new GameClass(self.current);
						DataBase.add(self.current);
						loading = false;
						self.refresh();
						break;
				}
				//console.info('SaveDialog',self.cMode(),self.current);
			};
			self.AddNew = function(model,event,type){
				//console.info('AddNew',type);
				type = type || 'character';
				self.selected(false);
				self.cMode(type);
				self.SaveIfChanged();
				self.current = {
					type : type
				};
				self.GetAttribute('name','',true);
				self.GetAttribute('description','',true);
				
				self.ShowDialog('new_object');
				//console.info('AddNew',type,self.cMode());
			};
			self.RemoveItem = function(model,event){
				self.CloseDialog();
			};
		}
		

		function setError(err_id){
			switch(err_id){
				case 1:
					self.Error('Invalid Password!');
					break;
				default:
					self.Error(false);
					break;
			}
		}
		$('.dtemplate').each(function(){
			var form = $(this).find('.uk-form');
			if(form.length>0)
				templates[$(this).attr('id')] = form.html();
			else
				templates[$(this).attr('id')] =  $(this).html();
		});
		function get_template(id){
			return templates[id];
		}
		//console.log('templates',templates);
		for(var t in templates){
			$('#'+t).remove();
		}
		
		self.ShowDialog = function(tmpl){
			ko.cleanNode($("#dialogContent")[0]);
			$('#dialogContent').empty().html(get_template(tmpl));
			ko.applyBindings(self, $("#dialogContent")[0]);
			$('#dynamicDialog').show();
			$('.dialogWrapper').css({
				top  : Math.max(0, (($(window).height() - $('.dialogWrapper').outerHeight()) / 2) + $(window).scrollTop()) + "px",
				left : Math.max(0, (($(window).width() - $('.dialogWrapper').outerWidth()) / 2) + $(window).scrollLeft()) + "px"
			});
			$("#dialogContent").find('#btn_close').on('click',function(){
				//self.SaveDialog('close');
			});
		};
		self.CloseDialog = function(){
			ko.cleanNode($("#dialogContent")[0]);
			$('#dialogContent').empty();
			$('#dynamicDialog').hide();

		};
		
		
		self.loadDataBase = function(content){
			var data = jQuery.parseJSON( content );
			console.info('loadDataBase',data);
			selected = null;
			DataBase.SetConfig(data);
			self.refresh();
			self.SelectObject(null);
			
			self.Loading(false);
		};
		self.SaveTree = function(){
			var conf = DataBase.GetConfig();
			var file = {
				type : 'json',
				name : 'gametree.json',
				content : conf
			};
			//console.info('SaveTree',conf);
			var files = [];
			files.push(file);
			zipData(files,function(){
				//self.Loading(false);	
			});
		};
		self.LoadTree = function(){
			console.log('LoadTree',self.current);
			$('#openFile').click();
		};
		self.Loading = function(show){
			if(!show){
				var h = setTimeout(function(){
					clearTimeout(h);
					self.CloseDialog();
				},100);
			}
			else{
				self.ShowDialog('DynamicLoader');
			}
		};
		
		self.Loading(true);


		/* TABLE FUNCTION : START */
		var fileList = { 
			json : null
		};

		/* FILE FUNCTION : START */
		self.LoadZip = function(f){
			var reader = new FileReader();
			var name = f.name;
			reader.onload = function(e) {
				var Zip = new JSZip();
				Zip.loadAsync(reader.result).then(function(zip) {
					Zip.forEach(function (relativePath, file){						
						var ext = relativePath.substring(relativePath.lastIndexOf('.') + 1).toLowerCase();
						//console.info("iterating over",ext, relativePath,file);
						switch(ext){
							case 'json':
								fileList[ext] = {
									ext : ext, 
									path : relativePath
								};								
								break;
						}						
					});
				}).then(function (zip) {
					if(fileList.json){
						Zip.file(fileList.json.path).async("string").then(function(content){
							self.loadDataBase(content);
							return content;
						});
					}
				});
				
			};
			reader.readAsArrayBuffer(f);
		};
		
		var field = document.getElementById('openFile');
		field.onchange = function (event) {
			fileList = { 
				json : null
			};

			if (typeof (FileReader) == "undefined") {
				 return;
			}
			event.stopPropagation();
			event.preventDefault();
			var files = event.target.files;
			console.info('files',files); 
			var fhandle = files[0];
			var filePath = fhandle.name;
			var extn = filePath.substring(filePath.lastIndexOf('.') + 1).toLowerCase();
			console.info('extn',fhandle,extn); 
			self.Loading(true);

			switch(extn){
				case 'zip':
					self.LoadZip(fhandle);
					break;
				default:
					self.Loading();
					break;
			}
		};
		/* FILE FUNCTION : END */
		init();
		self.Loading();

	};
	
	ko.applyBindings(new MainModel());

