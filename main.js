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

	var db = new ArrayDB();
	
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

