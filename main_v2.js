	/*
	
	http://caragulak.nsupdate.info/proj/gametree/index_v2.html 


		Stats
		
	*/

	var db = new ArrayDB();
	
	ko.bindingHandlers.ko_autocomplete = {
		init: function (element, params) {
			$(element).autocomplete(params());
		},
		update: function (element, params) {
			$(element).autocomplete("option", "source", params().source);
		}
	};
	

	
	var MainModel = function() {
		var self = this;
		var templates = {};
		var gameDB = new GameDatabase();
		
		self.Error = ko.observable();
		self.current = null;
		self.Types = ko.observableArray([]);
		self.Attributes = ko.observableArray([]);
		self.SearchAttribute = ko.observableArray([]);
		self.SearchName = ko.observable();
		
		self.chosenObject  = ko.observable();
		self.chosenChild  = ko.observable();
		self.chosenChildNot  = ko.observable();
		
		self.chosenAttribute = ko.observable();
		
		self.objChildren = ko.observableArray([]);
		self.objChildrenNot = ko.observableArray([]);
		
		self.Objects = ko.observableArray([]);
		self.cMode = ko.observable();
		self.Attribute = {};
		self.selected = ko.observable();
		var loading = false;
		var selected;
		var target_obj;
		var searchData = {
			txt : '',
			attr : ''
		};
		self.GetAttribute = function(name,value,set){
			if(!self.Attribute[name]) self.Attribute[name] = ko.observable(value);
			if(set){
				self.Attribute[name](value);
			}
			return self.Attribute[name]();
		};
		
		function init(){
			self.activateObjectChildren  = function(item){				
				if(selected){
					gameDB.equip(selected.global_id,item.global_id,item.active());
				}				
				return true;
			}
			self.removeObjectChildren = function(item){
				console.info('item',item);
				var options = [];
				if(selected && item){
					gameDB.child_remove(selected,item.global_id);
					self.getObjectChildren();
				}
			};
			self.addObjectChildren = function(model,event){
				var options = self.chosenChildNot();
				if(selected && options.length>0){
					gameDB.child_add(selected,options[0]);
					self.getObjectChildren();
				}
			};
			self.getObjectChildren = function(model,event){
				if(loading) return;
				loading = true;
				var options = self.chosenObject();
				if(options && options.length>0){
					selected = gameDB.get(options[0]);
					gameDB.children(selected,self.objChildren);
					gameDB.children_not(selected,self.objChildrenNot);
					//console.info('getObjectChildren',selected);
				}
				loading = false;
			};
			self.ManageTree = function(){
				
				self.selected(false);
				self.cMode('manage');
				self.current = {
					type : 'manage'
				};
				loading = true;
				gameDB.Objects(self.Objects);
				loading = false;
				self.ShowDialog('object_children');
				
			};
			self.GetTitle = function(attr){
				if(attr.max && attr.min)
					return attr.min+'/'+attr.value+'/'+attr.max;
				return attr.value;
			};
			self.AttributeRemove = function(attr,item){
				if(loading) return;
				loading = true;

				target_obj = item || selected;
				if(target_obj){
					//console.log('AttributeRemove',target_obj,item,attr);
					gameDB.remove_attr(target_obj,attr);
					gameDB.Attributes(target_obj.global_id,self.Attributes);
				}
				target_obj = null;
				loading = false;
			};
			self.ObjectAttribute = function(attr,item){
				if(loading) return;
				loading = true;
				target_obj = item || selected;
				if(!attr){
					attr = {
						name : '',
						value : '',
						type : 'attribute',
						formula : '',
						params : '',
						min : '',
						max : ''
					};
				}
				self.cMode('attribute');
				self.current = attr;
				self.GetAttribute('name',attr.name,true);
				self.GetAttribute('value',attr.value,true);
				self.GetAttribute('formula',attr.formula,true);
				self.GetAttribute('params',attr.params,true);
				self.GetAttribute('min',attr.min,true);
				self.GetAttribute('max',attr.max,true);
				self.ShowDialog('object_attribute');
				loading = false;
				//console.log('ObjectAttribute',target_obj,item,attr);
			};
			self.canEdit = function(name){
				return name.indexOf('$')!=0;
			};

			self.ObjectCopy = function(item){
				if(loading) return;
				loading = true;
				gameDB.clone(item);
				gameDB.Objects(self.Objects);
				loading = false;
			};
			self.ObjectRemove = function(item){
				if(loading) return;
				loading = true;

				console.log('ObjectRemove',selected);
				//selected.getType({type:'attribute'},self.Attributes);
				gameDB.remove(item);
				self.refresh();
				loading = false;
			};
			self.ObjectSelect = function(item){
				if(loading) return;
				loading = true;
				selected = item || selected;
				if(selected){
					//selected.getType({type:'attribute'},self.Attributes);
					self.selected(selected.global_id);
					gameDB.children(selected,self.objChildren);
					gameDB.Attributes(selected.global_id,self.Attributes);
					var stats = gameDB.ATTR(selected.global_id);
					console.log('ObjectSelect',selected,stats);
				}else{
					self.Attributes.removeAll();
					self.Types.removeAll();
					self.selected(false);
				}
				loading = false;
			};
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
								//selected.setAttribute('avatar',k);
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
			
			self.refresh = function(){		
				loading = true;
				self.Attributes.removeAll();
				self.Types.removeAll();

				gameDB.Objects(self.Objects);
				loading = false;
			};

			self.SaveDialog = function(model,event){
				loading = true;
				self.CloseDialog();
				self.current.type = self.current.type || self.cMode();
				console.log('SaveDialog',selected,target_obj,self.current);
				switch(self.current.type){
					case 'attribute':
						self.current.name = self.GetAttribute('name');
						self.current.value = self.GetAttribute('value');
						self.current.formula = self.GetAttribute('formula');
						self.current.params = self.GetAttribute('params');
						self.current.min = self.GetAttribute('min');
						self.current.max = self.GetAttribute('max');
						if(target_obj){
							gameDB.change(target_obj,self.current);
							loading = false;
							self.ObjectSelect();
						}
						target_obj = null;
						break;
					case 'object':
						gameDB.add(self.GetAttribute('name'));
						self.refresh();
						break;
				}
				//self.selected(false);
				loading = false;
				//console.info('SaveDialog',self.cMode(),self.current);
			};
			self.AddNew = function(model,event,type){
				//console.info('AddNew',type);
				type = type || 'object';
				self.selected(false);
				self.cMode(type);
				self.current = {
					type : type
				};
				self.GetAttribute('name','',true);
				
				self.ShowDialog('new_object');
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
			gameDB.config(data);
			// DataBase.SetConfig(data);
			self.refresh();
			self.Loading(false);
		};
		self.SaveTree = function(){
			var conf = gameDB.config();
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

