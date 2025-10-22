var ZaluknijAddon = {
  buildSearchUrl: function(params) {
    return "https://zaluknij.cc/wyszukiwarka?phrase=" + encodeURIComponent(params.title);
  },
  
  // Zamiast parsować, zwróć konfigurację JAK parsować
  getSearchConfig: function(params) {
    return {
      sectionIndex: params.isSerial ? 3 : 1,
      itemSelector: 'a.item',
      titleSelector: '.title',
      urlAttribute: 'href',
      checkUrl: params.isSerial ? '/serial-online/' : '/film-online/'
    };
  },
  
  getMediaLinksConfig: function() {
    return {
      tableId: 'link-list',
      rowSelector: 'tbody tr',
      iframeAttribute: 'data-iframe',
      languageCell: 2,
      qualityCell: 3
    };
  },
  
  getEpisodeConfig: function() {
    return {
      listId: 'episode-list',
      seasonPattern: 'Sezon (\\d+)',
      episodePattern: '\\d+e(\\d+)'
    };
  },
  
  // Mapowanie języków i jakości
  mapLanguage: function(lang) {
    var l = lang.toLowerCase();
    if (l === 'lektor') return 'Voice_Over';
    if (l === 'napisy pl') return 'Subtitles';
    if (l === 'dubbing') return 'Dubbing';
    if (l === 'lektor ivo') return 'Voice_Over_IVO';
    return 'PL';
  },
  
  mapQuality: function(qual) {
    var q = qual.toLowerCase();
    if (q === 'wysoka') return '1080p';
    if (q === 'średnia') return '720p';
    return '360p';
  },
  
  decodeIframeData: function(base64Data) {
    try {
      var decoded = this._base64Decode(base64Data);
      var match = decoded.match(/"src":"([^"]*)"/);
      if (match) {
        return match[1].replace(/\\\//g, '/');
      }
    } catch (e) {}
    return null;
  },
  
  _base64Decode: function(str) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var output = '';
    str = str.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    var i = 0;
    
    while (i < str.length) {
      var enc1 = chars.indexOf(str.charAt(i++));
      var enc2 = chars.indexOf(str.charAt(i++));
      var enc3 = chars.indexOf(str.charAt(i++));
      var enc4 = chars.indexOf(str.charAt(i++));
      
      var chr1 = (enc1 << 2) | (enc2 >> 4);
      var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      var chr3 = ((enc3 & 3) << 6) | enc4;
      
      output = output + String.fromCharCode(chr1);
      if (enc3 !== 64) output = output + String.fromCharCode(chr2);
      if (enc4 !== 64) output = output + String.fromCharCode(chr3);
    }
    
    return output;
  }
};

addon = ZaluknijAddon;
