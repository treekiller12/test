// Helper functions
function base64Decode(str) {
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

function normalize(title) {
  return title.split('/')[0].trim()
    .replace(/\.\s+/g, ': ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesTitle(item, search) {
  var nItem = normalize(item);
  var nSearch = normalize(search);
  return nItem.indexOf(nSearch) !== -1 || nSearch.indexOf(nItem) !== -1 || nItem === nSearch;
}

var ZaluknijAddon = {
  buildSearchUrl: function(params) {
    return "https://zaluknij.cc/wyszukiwarka?phrase=" + encodeURIComponent(params.title);
  },
  
  parseSearch: function(html, title, originalTitle, isSerial) {
    console.log('[parseSearch] Called');
    console.log('[parseSearch] HTML length: ' + html.length);
    console.log('[parseSearch] Title: ' + title);
    console.log('[parseSearch] IsSerial: ' + isSerial);
    
    // Znajdź sekcje <div class="row">
    var rowPattern = /<div[^>]*class="[^"]*row[^"]*"[^>]*>/g;
    var rowMatches = [];
    var match;
    
    while ((match = rowPattern.exec(html)) !== null) {
      rowMatches.push(match.index);
    }
    
    console.log('[parseSearch] Found ' + rowMatches.length + ' row sections');
    
    if (rowMatches.length <= (isSerial ? 3 : 1)) {
      console.log('[parseSearch] Not enough sections');
      return null;
    }
    
    var targetIndex = isSerial ? 3 : 1;
    var sectionStart = rowMatches[targetIndex];
    var sectionEnd = rowMatches[targetIndex + 1] || html.length;
    var section = html.substring(sectionStart, sectionEnd);
    
    console.log('[parseSearch] Section length: ' + section.length);
    
    // Znajdź linki z klasą "item"
    var itemPattern = /<a[^>]*class="[^"]*item[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    var itemCount = 0;
    
    while ((match = itemPattern.exec(section)) !== null) {
      itemCount++;
      var url = match[1];
      var itemContent = match[2];
      
      console.log('[parseSearch] Item ' + itemCount + ' URL: ' + url);
      console.log('[parseSearch] Item content length: ' + (itemContent ? itemContent.length : 'null'));
      
      if (!itemContent) {
        console.log('[parseSearch] WARNING: itemContent is null/undefined!');
        continue;
      }
      
      var isSerialUrl = url.indexOf('/serial-online/') !== -1;
      console.log('[parseSearch] Is serial URL: ' + isSerialUrl + ' (looking for: ' + isSerial + ')');
      
      if (isSerial !== isSerialUrl) {
        console.log('[parseSearch] Type mismatch, skipping');
        continue;
      }
      
      var titleMatch = itemContent.match(/<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]*)<\/div>/);
      
      if (!titleMatch) {
        console.log('[parseSearch] No title found in item content');
        console.log('[parseSearch] Item content preview: ' + itemContent.substring(0, 200));
        continue;
      }
      
      var itemTitle = titleMatch[1].trim();
      console.log('[parseSearch] Item title: ' + itemTitle);
      
      var parts = itemTitle.split('/');
      
      if ((title && parts.length > 0 && matchesTitle(parts[0], title)) ||
          (originalTitle && parts.length > 1 && matchesTitle(parts[1], originalTitle))) {
        console.log('[parseSearch] MATCH FOUND!');
        return {url: url, title: itemTitle};
      }
    }
    
    console.log('[parseSearch] Total items checked: ' + itemCount);
    console.log('[parseSearch] No match found');
    return null;
  },
  
  parseMediaLinks: function(html) {
    var links = [];
    
    var tablePattern = /<table[^>]*id="link-list"[^>]*>([\s\S]*?)<\/table>/;
    var tableMatch = html.match(tablePattern);
    if (!tableMatch) return links;
    
    var tableHtml = tableMatch[1];
    var rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    var match;
    
    while ((match = rowPattern.exec(tableHtml)) !== null) {
      var rowHtml = match[1];
      
      var iframeMatch = rowHtml.match(/data-iframe="([^"]*)"/);
      if (!iframeMatch) continue;
      
      try {
        var encoded = iframeMatch[1];
        var decoded = base64Decode(encoded);
        
        var urlMatch = decoded.match(/"src":"([^"]*)"/);
        if (!urlMatch) continue;
        
        var url = urlMatch[1].replace(/\\\//g, '/');
        
        var cells = [];
        var cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/g;
        var cellMatch;
        
        while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
          var cellText = cellMatch[1].replace(/<[^>]*>/g, '').trim();
          cells.push(cellText);
        }
        
        if (cells.length < 4) continue;
        
        var lang = cells[2].toLowerCase();
        var qual = cells[3].toLowerCase();
        
        var mappedLang = 'PL';
        if (lang === 'lektor') mappedLang = 'Voice_Over';
        else if (lang === 'napisy pl') mappedLang = 'Subtitles';
        else if (lang === 'dubbing') mappedLang = 'Dubbing';
        else if (lang === 'lektor ivo') mappedLang = 'Voice_Over_IVO';
        
        var mappedQual = '360p';
        if (qual === 'wysoka') mappedQual = '1080p';
        else if (qual === 'średnia') mappedQual = '720p';
        
        links.push({
          url: url,
          language: mappedLang,
          quality: mappedQual,
          source: 'Zaluknij'
        });
      } catch (e) {}
    }
    
    return links;
  },
  
  parseEpisodeUrl: function(html, season, episode) {
    var listPattern = /<ul[^>]*id="episode-list"[^>]*>([\s\S]*?)<\/ul>/;
    var listMatch = html.match(listPattern);
    if (!listMatch) return null;
    
    var listHtml = listMatch[1];
    var seasonPattern = /<li[^>]*>([\s\S]*?)<\/li>/g;
    var match;
    
    while ((match = seasonPattern.exec(listHtml)) !== null) {
      var seasonHtml = match[1];
      
      var seasonNumMatch = seasonHtml.match(/Sezon (\d+)/);
      if (!seasonNumMatch) continue;
      
      var seasonNum = parseInt(seasonNumMatch[1]);
      if (seasonNum !== season) continue;
      
      var epPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
      var epMatch;
      
      while ((epMatch = epPattern.exec(seasonHtml)) !== null) {
        var epUrl = epMatch[1];
        var epText = epMatch[2];
        
        var epNumMatch = epText.match(/\d+e(\d+)/i);
        if (!epNumMatch) continue;
        
        var epNum = parseInt(epNumMatch[1]);
        if (epNum === episode) {
          return epUrl;
        }
      }
    }
    
    return null;
  }
};

addon = ZaluknijAddon;
