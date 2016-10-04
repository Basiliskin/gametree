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
 

Date.prototype.toStr = function() {
	function pad(n) {
		return n < 10 ? '0' + n : n;
	}
	return pad(this.getUTCDate()) + pad(this.getUTCMonth() + 1)  +'_'+ pad(this.getUTCHours()) + pad(this.getUTCMinutes());
};

function wordExport(elm) {
	var static = {
		mhtml: {
			top: "Mime-Version: 1.0\nContent-Base: " + location.href + "\nContent-Type: Multipart/related; boundary=\"NEXT.ITEM-BOUNDARY\";type=\"text/html\"\n\n--NEXT.ITEM-BOUNDARY\nContent-Type: text/html; charset=\"utf-8\"\nContent-Location: " + location.href + "\n\n<!DOCTYPE html>\n<html>\n_html_</html>",
			head: "<head>\n<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\n<style>\n_styles_\n</style>\n</head>\n",
			body: "<body>_body_</body>"
		}
	};
	var options = {
		maxWidth: 624
	};
	// Clone selected element before manipulating it
	var markup = $(elm).clone();

	// Remove hidden elements from the output
	markup.each(function() {
		var self = $(this);
		if (self.is(':hidden'))
			self.remove();
	});

	// Embed all images using Data URLs
	var images = Array();
	var img = markup.find('img');
	for (var i = 0; i < img.length; i++) {
		// Calculate dimensions of output image
		var w = Math.min(img[i].width, options.maxWidth);
		var h = img[i].height * (w / img[i].width);
		// Create canvas for converting image to data URL
		$('<canvas>').attr("id", "jQuery-Word-export_img_" + i).width(w).height(h).insertAfter(img[i]);
		var canvas = document.getElementById("jQuery-Word-export_img_" + i);
		canvas.width = w;
		canvas.height = h;
		// Draw image to canvas
		var context = canvas.getContext('2d');
		context.drawImage(img[i], 0, 0, w, h);
		// Get data URL encoding of image
		var uri = canvas.toDataURL();
		$(img[i]).attr("src", img[i].src);
		img[i].width = w;
		img[i].height = h;
		// Save encoded image to array
		images[i] = {
			type: uri.substring(uri.indexOf(":") + 1, uri.indexOf(";")),
			encoding: uri.substring(uri.indexOf(";") + 1, uri.indexOf(",")),
			location: $(img[i]).attr("src"),
			data: uri.substring(uri.indexOf(",") + 1)
		};
		// Remove canvas now that we no longer need it
		canvas.parentNode.removeChild(canvas);
	}

	// Prepare bottom of mhtml file with image data
	var mhtmlBottom = "\n";
	for (var i = 0; i < images.length; i++) {
		mhtmlBottom += "--NEXT.ITEM-BOUNDARY\n";
		mhtmlBottom += "Content-Location: " + images[i].contentLocation + "\n";
		mhtmlBottom += "Content-Type: " + images[i].contentType + "\n";
		mhtmlBottom += "Content-Transfer-Encoding: " + images[i].contentEncoding + "\n\n";
		mhtmlBottom += images[i].contentData + "\n\n";
	}
	mhtmlBottom += "--NEXT.ITEM-BOUNDARY--";

	//TODO: load css from included stylesheet
	var styles = "";

	// Aggregate parts of the file together 
	var fileContent = static.mhtml.top.replace("_html_", static.mhtml.head.replace("_styles_", styles) + static.mhtml.body.replace("_body_", markup.html())) + mhtmlBottom;

	// Create a Blob with the file contents
	
	//saveAs(blob, fileName + ".doc");
	return fileContent;
};

function zipData(files,onfinish,name){
	// create div = data;
	var zip = new JSZip();
	for(var i=0;i<files.length;i++){
		var file = files[i];
		switch(file.type){
			case 'doc':
				var blob = new Blob([file.content], {
					type: "application/msword;charset=utf-8"
				});
				zip.file(file.name, blob);
				break;
			case 'json':
				zip.file(file.name, JSON.stringify(file.content));
				break;
			default:
				zip.file(file.name,file.content);
				break;
		}
	}
	
	zip.generateAsync({compression:'DEFLATE',type:"blob"}).then(function (blob) {
		saveAs(blob, (name ? name : 'unicorn_book_')+new Date().toStr()+'.zip');//saveAs(blob, "hello.zip");
		if(onfinish) onfinish();
	});
}
var Base64 = (function() {
    "use strict";

    var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    var _utf8_encode = function (string) {

        var utftext = "", c, n;

        string = string.replace(/\r\n/g,"\n");

        for (n = 0; n < string.length; n++) {

            c = string.charCodeAt(n);

            if (c < 128) {

                utftext += String.fromCharCode(c);

            } else if((c > 127) && (c < 2048)) {

                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);

            } else {

                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);

            }

        }

        return utftext;
    };

    var _utf8_decode = function (utftext) {
        var string = "", i = 0, c = 0, c1 = 0, c2 = 0;

        while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {

                string += String.fromCharCode(c);
                i++;

            } else if((c > 191) && (c < 224)) {

                c1 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c1 & 63));
                i += 2;

            } else {

                c1 = utftext.charCodeAt(i+1);
                c2 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c1 & 63) << 6) | (c2 & 63));
                i += 3;

            }

        }

        return string;
    };

    var _hexEncode = function(input) {
        var output = '', i;

        for(i = 0; i < input.length; i++) {
            output += input.charCodeAt(i).toString(16);
        }

        return output;
    };

    var _hexDecode = function(input) {
        var output = '', i;

        if(input.length % 2 > 0) {
            input = '0' + input;
        }

        for(i = 0; i < input.length; i = i + 2) {
            output += String.fromCharCode(parseInt(input.charAt(i) + input.charAt(i + 1), 16));
        }

        return output;
    };

    var encode = function (input) {
        var output = "", chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;

        input = _utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output += _keyStr.charAt(enc1);
            output += _keyStr.charAt(enc2);
            output += _keyStr.charAt(enc3);
            output += _keyStr.charAt(enc4);

        }

        return output;
    };

    var decode = function (input) {
        var output = "", chr1, chr2, chr3, enc1, enc2, enc3, enc4, i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = _keyStr.indexOf(input.charAt(i++));
            enc2 = _keyStr.indexOf(input.charAt(i++));
            enc3 = _keyStr.indexOf(input.charAt(i++));
            enc4 = _keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output += String.fromCharCode(chr1);

            if (enc3 !== 64) {
                output += String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
                output += String.fromCharCode(chr3);
            }

        }

        return _utf8_decode(output);
    };

    var decodeToHex = function(input) {
        return _hexEncode(decode(input));
    };

    var encodeFromHex = function(input) {
        return encode(_hexDecode(input));
    };

    return {
        'encode': encode,
        'decode': decode,
        'decodeToHex': decodeToHex,
        'encodeFromHex': encodeFromHex
    };
}());