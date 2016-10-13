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
		saveAs(blob, (name ? name : 'dima_')+new Date().toStr()+'.zip');
		if(onfinish) onfinish();
	});
}

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

