var Sites, imgurAlbum, basicMatch, stripUrl, getUrls;
var urlArray = [];

Sites = {};

imgurAlbum = {

  isAlbum: null,
  id: null,
  index: null,
  cached: {},

  images: function() {
    if (this.id && this.isAlbum)
      return this.cached[id].images;
  },
  captions: function() {
    if (this.id && this.isAlbum)
      return this.cached[id].captions;
  },

  getAlbum: function(id) {
    if (!imgurAlbum.cached[id]) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://api.imgur.com/2/album/' + id.replace(/#.*/, '') + '.json', false);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var images = JSON.parse(xhr.responseText).album.images;
          this.cached[id] = {};
          this.cached[id].index = 0;
          this.cached[id].images = [];
          this.cached[id].captions = [];
          for (var i = 0; i < images.length; i++) {
            this.cached[id].images.push(images[i].links.original);
            this.cached[id].captions.push(images[i].image.caption.trim());
          }
        }
      }.bind(this);
      xhr.send();
    }
    if (!this.cached[id]) {
      return false;
    }
    this.id = id;
    this.isAlbum = true;
    imageZoom.albumIndex.innerText = this.cached[id].index + 1 + '/' + this.cached[id].images.length;
    imageZoom.caption.innerHTML = this.cached[this.id].captions[this.cached[this.id].index];
    if (imageZoom.caption.innerText.trim() !== '') {
      imageZoom.caption.style.display = 'block';
    }
    return this.cached[id].images[this.cached[id].index];
  },

  getImage: function(next) {
    var albumLength = this.cached[this.id].images.length;
    var index = this.cached[this.id].index;
    if (this.cached[this.id].images.length > 1) {
      if (next) {
        this.cached[this.id].index = (index + 1 < albumLength) ? index + 1 : 0;
      } else {
        this.cached[this.id].index = (index - 1 < 0) ? albumLength - 1 : index - 1;
      }
      imageZoom.albumIndex.innerText = this.cached[this.id].index + 1 + '/' + albumLength;
      var img = new Image();
      img.src = this.cached[this.id].images[this.cached[this.id].index];
      if (this.isAlbum) {
        imageZoom.caption.innerHTML = this.cached[this.id].captions[this.cached[this.id].index];
        imageZoom.caption.style.display = 'block';
      }
      if (imageZoom.caption.innerHTML === '') {
        imageZoom.caption.innerHTML = '';
        imageZoom.caption.style.display = 'none';
      }
      imageZoom.appendImage(img.src, true);
    }
  }

};

basicMatch = function(url) {
  return (/\.(png|jpeg|jpg|svg|gif|tif|tiff|bmp)((:large|((\\?[^?])+))$)?/i).test(url);
};

stripUrl = function(url) {
  if (!url) {
    return;
  }
  url = url.replace(/^http(s)?:\/\//, '');
  url = '.' + url.replace(/\/.*/, '');
  url = url.replace(/.*\.(([^\.]+)\.([^\.]+)$)/, '$1');
  return url;
};

getUrls = function(elems) {
  if (urlArray.length) {
    return urlArray;
  }
  for (var i = 0, l = elems.length; i < l; i++) {
    if (elems[i] && elems[i].href) {
      urlArray.push(elems[i].href);
    }
  }
  return urlArray;
};

Sites.github = function(elem, callback) {
  var url = elem.src;
  if (!url || !/avatars/.test(url) || !/githubusercontent\.com/.test(stripUrl(url))) {
    return;
  }
  callback(url.replace(/\?.*/, ''));
};

Sites.gravatar = function(elem, callback) {
  var url = elem.src;
  if (!url || !/gravatar\.com/.test(stripUrl(url)) || !basicMatch(url)) {
    return;
  }
  callback(url);
};

Sites.twitter = function(elem, callback) {
  var img;
  if (elem.className === 'media-overlay' && elem.previousElementSibling.src) {
    img = elem.previousElementSibling.src;
  } else if (/twimg.*_(normal|bigger)/.test(elem.src)) {
    img = elem.src.replace(/(twimg.*)_(normal|bigger)/, '$1');
  } else if (/twimg/.test(stripUrl(elem.src))) {
    img = elem.src.replace(/:thumb/, '') + ':large';
  } else if (elem.firstChild && /twimg/.test(elem.firstChild.src)) {
    img = elem.firstChild.src + ':large';
  } else if (elem.parentNode && /is-preview/.test(elem.parentNode.className)) {
    img = elem.src;
  }
  if (img) {
    callback(img);
  }
};

Sites.livememe = function(elem, callback) {
  var base = /livememe\.com/i;
  if (base.test(stripUrl(elem.href)) || (elem.parentNode && base.test(stripUrl(elem.parentNode.href)))) {
    base = /[a-zA-Z0-9]{7}/;
    if (elem.href && base.test(elem.href)) {
      callback(elem.href + '.jpg');
    } else if (elem.parentNode.href && base.test(elem.parentNode.href)) {
      callback(elem.parentNode.href + '.jpg');
    }
  }
};


Sites.imgur = function(elem, callback) {
  function getGifvSource(url) {
    if (url.indexOf('http:') > -1) {
      url = url.split('http:')[1];
    }

    if (url.indexOf('https:') > -1) {
      url = url.split('https:')[1];
    }

    imageZoom.isVideo = true;
    imageZoom.videoSource.type = 'video/webm';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url + (/\.gifv$/.test(url) ? "" : "v"));
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        if(xhr.responseText.match(/source src=["']([^"']+)["']/i)) {
          callback(xhr.responseText.match(/source src=["']([^"']+)["']/i)[0].replace(/^.*src=["']/, '').replace(/["']$/, ''), xhr.responseText.match(/poster=["']([^["']+)["']/i)[0].replace(/^.*=["']/, '').replace(/["']$/, ''));
        } else {
          imageZoom.isVideo = false;
          delete imageZoom.videoSource.type;
          callback(url);
        }
      }
    };
    xhr.send();
  };

  getUrls([elem, elem.parentNode]).forEach(function(url) {
    if (!/\/random/.test(url) && /imgur\.com/i.test(stripUrl(url))) {
      imgurAlbum.isAlbum = false;

      if (/\.gifv?$/.test(url)) {
        getGifvSource(url);
        return;
      }
      if (basicMatch(url)) {
        return callback(url);
      }

      if (/\/a\//.test(url)) {
        return callback(imgurAlbum.getAlbum(url.replace(/.*\/a\//, '')));
      }
      if (/\/gallery\/(([a-zA-Z0-9]){7})/.test(url)) {
        return callback(url.replace('/gallery/', '/') + '.jpg');
      }
      if (/\/gallery\//.test(url)) {
        return callback(imgurAlbum.getAlbum(url.replace(/.*gallery/, '')));
      }
      var suffix = url.replace(new RegExp('.*' + stripUrl(url) + '(\/)?', 'i'), '');
      if (suffix.length === 7) {
        return callback(url + '.jpg');
      }
    }
  });
};

Sites.wikimedia = function(elem, callback) {
  var url = elem.src;
  if (/(wikipedia|wikimedia)\.org/i.test(stripUrl(url)) && !/\.ogv|\.ogg/.test(url) && basicMatch(url)) {
    url = url.replace(/\/thumb/, '');
    if (/.*\.(png|jpg|jpeg|gif|svg|tif).*\.(png|jpg|jpeg|gif|svg|tif)/i.test(url)) {
      url = url.replace(/\/([^\/]+)$/, '');
    }
    callback(url);
  }
};

Sites.facebook = function(elem, callback) {
  if (!/facebook\.com/.test(document.URL) || /ContentWrapper/.test(elem.className) || /(fbexternal|_b\.([a-zA-Z]+)$)/.test(elem.src))
    return false;
  function trimUrl(url) {
    if (url)
      return url.replace(/\/[tc][0-9]+\.[^\/]+/g, '').replace(/\/[sp][0-9]+x[0-9]+\//, '/').replace(/_[a-z](\.[a-z]+$)/, '_o$1').replace(/\/[a-z]\//, '/');
  }

  if (/ImageContainer/.test(elem.className) && elem.firstChild && elem.firstChild.src)
    callback(trimUrl(elem.firstChild.src));
  else if (elem.nodeName === 'I' && elem.style.backgroundImage)
    callback(trimUrl(elem.style.backgroundImage.replace(/^url\(/, '').replace(/\)$/, '')));
  else {
    var e = elem.firstChild;
    if (e && e.firstChild && e.firstChild.src)
      callback(trimUrl(e.firstChild.src));
    else callback(trimUrl(elem.src));
  }
};


Sites.deviantart = function(elem, callback) {
  getUrls([elem, elem.parentNode]).forEach(function(url) {
    if (/deviantart\.(com|net)/i.test(url)) {
      if (/\/fs([0-9]+)\/[a-zA-Z]\//.test(url)) {
        callback(url);
      } else if (/\/art\//i.test(url)) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://backend.deviantart.com/oembed?url=' + url);
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4 && xhr.status === 200) {
            var parsed = JSON.parse(xhr.responseText);
            return callback(parsed.url);
          }
        };
        xhr.send();
      }
    }
  });
};

Sites.googleUserContent = function(elem, callback) {
  if (!/googleusercontent\.com/.test(stripUrl(elem.src)) || !basicMatch(elem.src)) {
    return;
  }
  function trimUrl(url) {
    return url.replace(/\/[a-z][0-9]([^\/]+)(\/([^\/]+)\.(jpg|svg|jpeg|png|gif|tif)$)/i, '/s0$2');
  }
  callback(trimUrl(elem.src));
};

Sites.normal = function(elem, callback) {
  getUrls([elem, elem.parentNode, elem.parentNode.parentNode]).forEach(function(url) {
    if (basicMatch(url)) {
      return callback(url.replace(/.*url=/, '').replace(/.*moapi\.net\//, ''));
    }
  });
};

Sites.gfycat = function(elem, callback) {
  function getGfySource(url) {
    url = url.replace('http', 'https');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        imageZoom.isVideo = true;
        imageZoom.videoSource.type = 'video/webm';
        callback(xhr.responseText.match(/source id=["']webmsource["'] src=["']([^"']+)["']/i)[0].replace(/^.*src=["']/, '').replace(/["']$/, ''), xhr.responseText.match(/poster=["']([^["']+)["']/i)[0].replace(/^.*=["']/, '').replace(/["']$/, ''));
      }
    };
    xhr.send();
  }
  getUrls([elem, elem.parentNode]).forEach(function(url) {
    if (!/\.gif$/.test(url) && /gfycat\.com/.test(stripUrl(url))) {
      getGfySource(url.replace(/[^a-zA-Z_-]+$/, ''));
      if (imageZoom.isVideo) {
        return;
      }
    }
  });
};

Sites.video = function(elem, callback) {
  getUrls([elem, elem.parentNode]).forEach(function(url) {
    if (/\.webm(\?([^?]+))?$/.test(url)) {
      imageZoom.isVideo = true;
      imageZoom.videoSource.type = 'video/webm';
      return callback(url);
    } else if (/\.(mp4|m4v)(\?([^?]+))?$/.test(url)) {
      imageZoom.videoSource.type = 'video/mp4';
      imageZoom.isVideo = true;
      return callback(url);
    } else if (/\.ogv(\?([^?]+))?$/.test(url)) {
      imageZoom.videoSource.type = 'video/ogg';
      imageZoom.isVideo = true;
      return callback(url);
    }
  });
};

Sites.xkcd = function(elem, callback) {
  getUrls([elem, elem.parentNode]).forEach(function(url) {
    if (/xkcd\.com/i.test(stripUrl(url)) && /xkcd\.com\/([0-9]+)(\/)?$/i.test(url)) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'http://xkcd.com/' + url.replace(/[^0-9]+/g, '') + '/info.0.json');
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          xhr = xhr.responseText;
          var img = xhr.replace(/.*(http:\\\/\\\/([^"]+)\.(png|jpg|jpeg|svg|tif)).*/i, '$1');
          img = unescape(decodeURIComponent(img.replace(/\\\//g, '/')));
          if (img) {
            callback(img);
          }
        }
      };
      xhr.send();
    }
  });
};

Sites.flickr = function(elem, callback) {
  var flickrApiPath = 'https://www.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=b5fcc857586ba650aa946ffee502daf2&format=json&photo_id=';
  getUrls([elem, elem.parentNode]).forEach(function(url) {
    if (/flickr\.com/i.test(stripUrl(url)) && /\/([0-9]){10,11}(\/|$)/i.test(url)) {
      var photo_id = url.match(/\/([0-9]){10,11}(\/|$)/)[0].replace(/\//g, '');
      var xhr = new XMLHttpRequest();
      xhr.open('GET', flickrApiPath + photo_id);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var parsed = JSON.parse(xhr.responseText.replace(/.*Api\(/, '').replace(/\)/, '')).sizes.size;
          return callback(parsed[parsed.length - 1].source);
        }
      };
      xhr.send();
      return;
    }
  });
};

Sites.youtube = function (elem, callback) {
  getUrls([elem, elem.parentNode]).forEach(function(url) {
    if(/(youtube\.com\/watch|youtu\.be)/i.test(url)) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      imageZoom.prevSourceURL = url;
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {

          var cfg = JSON.parse(xhr.responseText.split('ytplayer.config = ')[1].split(';ytplayer')[0]);

          var streams = parseYTConfig(cfg.args);

          streams = streams.filter(function (stream) {
            return stream.dash === false;
          });

          var stream;

          stream = find(function (stream) {
            return stream.dimension === '1280x720';
          }, streams);

          if(!stream) {
            stream = find(function (stream) {
              return stream.dimension === '640x360';
            }, streams);
          }

          var url = stream.url + "&cpn=" + encodeURIComponent(cfg.args.mpvid) + (stream.s || stream.sig ? "&signature=" + encodeURIComponent(stream.sig || ytcenter.utils.signatureDecipher(stream.s)) : "");


          imageZoom.isVideo = true;
          imageZoom.videoSource.type = stream.type.indexOf('video/webm') > -1 ? 'video/webm' : 'video/mp4';
          imageZoom.isYt = true;
          
          return callback(url);
        }
      };
      xhr.send();
      return;
    }
  });
};

signatureDecipher = function(signatureCipher, decipherRecipe){
  function swapHeadAndPosition(array, position) {
    var head = array[0];
    var other = array[position % array.length];
    array[0] = other;
    array[position] = head;
    return array;
  }
  if (!signatureCipher) return "";
  var cipherArray = signatureCipher.split(""), i;
  decipherRecipe = decipherRecipe || ytcenter.settings['signatureDecipher'];

  var funcMap = {};

  for (i = 0; i < decipherRecipe.length; i++) {
    if (decipherRecipe[i].func === "function") {
      funcMap[decipherRecipe[i].name] = new Function("a", "b", decipherRecipe[i].value);
    } else if (decipherRecipe[i].func === "call") {
      cipherArray = funcMap[decipherRecipe[i].name](cipherArray, decipherRecipe[i].value);
    } else if (decipherRecipe[i].func === "code") {
      cipherArray = new Function("a", decipherRecipe[i].value + "return a.join(\"\")")(cipherArray);
    } else if (decipherRecipe[i].func === "swapHeadAndPosition") {
      cipherArray = swapHeadAndPosition(cipherArray, decipherRecipe[i].value);
    } else if (decipherRecipe[i].func === "slice") {
      cipherArray = cipherArray.slice(decipherRecipe[i].value);
    } else if (decipherRecipe[i].func === "reverse") {
      cipherArray = cipherArray.reverse();
    }
  }
  if (!ytcenter.utils.isArray(cipherArray)) return signatureCipher;
  return cipherArray.join("");
};

function find(predicate, thisArg) {
    "use strict";
    //TODO: Check predicate is a function.
    var lastValue;
    if(!Array.prototype.some.call(thisArg, function(val, index, arr) {
        return predicate.call(thisArg, lastValue = val, index, arr);
    })) {
        return;
    }
    return lastValue;
};

function parseYTConfig(playerConfig){
  if (playerConfig.url_encoded_fmt_stream_map === "") return [];
  var parser1 = function(f){
    var a, r = [];
    try {
      var a = f.split(",");
      for (var i = 0; i < a.length; i++) {
        var b = a[i].split("/");
        var itag = b.shift();
        var dimension = b.shift();
        var minMajorFlashVersion = b.shift();
        var minMinorFlashVersion = b.shift();
        var revisionVersion = b.shift();
        r.push({
          itag: itag,
          dimension: dimension,
          flashVersion: {
            minMajor: minMajorFlashVersion,
            minMinor: minMinorFlashVersion,
            revision: revisionVersion
          }
        });
      }
    } catch (e) {
      console.error("[parseStreams] Error =>");
      console.error(e);
    }
    return r;
  };
  var parser2 = function(u){
    var a, b = [];
    try {
      a = u.split(",");
      for (var i = 0; i < a.length; i++) {
        var c = {};
        var d = a[i].split("&");
        for (var j = 0; j < d.length; j++) {
          var e = d[j].split("=");
          c[e[0]] = unescape(e[1]);
          if (e[0] === "type") c[e[0]] = c[e[0]].replace(/\+/g, " ");
        }
        b.push(c);
      }
    } catch (e) {
      console.error("[parseStreams] Error =>");
      console.error(e);
    }
    return b;
  };
  var parser3 = function(u){
    if (!u) return [];
    var a = u.split(",");
    var b = [];
    for (var i = 0; i < a.length; i++) {
      var c = {};
      var d = a[i].split("&");
      for (var j = 0; j < d.length; j++) {
        var e = d[j].split("=");
        c[e[0]] = unescape(e[1]);
        if (e[0] === "type") c[e[0]] = c[e[0]].replace(/\+/g, " ");
      }
      b.push(c);
    }
    return b;
  };
  var fmt = parser1(playerConfig.fmt_list);
  var streams = parser2(playerConfig.url_encoded_fmt_stream_map);
  var adaptive_fmts = parser3(playerConfig.adaptive_fmts);
  var a = [], i;
  for (i = 0; i < streams.length; i++) {
    var fl = null;
    for (var j = 0; j < fmt.length; j++) {
      if (streams[i].itag !== fmt[j].itag) continue;
      fl = fmt[j];
      break;
    }
    streams[i].dash = false;
    if (fl == null) {
      a.push(streams[i]);
    } else {
      var coll = streams[i];
      coll.dimension = fl.dimension;
      coll.flashVersion = fl.flashVersion;
      a.push(coll);
    }
  }
  for (i = 0; i < adaptive_fmts.length; i++) {
    adaptive_fmts[i].dash = true;
    a.push(adaptive_fmts[i]);
  }

  return a;
};
