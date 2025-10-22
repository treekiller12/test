var ZaluknijAddon = {
  buildSearchUrl: function(params) {
    return "https://zaluknij.cc/wyszukiwarka?phrase=" + encodeURIComponent(params.title);
  },
  
  parseSearch: function(params) {
    var html = params.html;
    var isSerial = params.isSerial;
    var searchTitle = params.title.toLowerCase();
    
    console.log('[Zaluknij JS] Parsing search, isSerial: ' + isSerial);
    console.log('[Zaluknij JS] Looking for: ' + searchTitle);
    
    // Znajdź sekcję z filmami/serialami
    // HTML ma strukturę: <div class="row"> ... </div>
    // Filmy są w 2. sekcji (index 1), seriale w 4. (index 3)
    
    var rowPattern = /<div[^>]*class="[^"]*row[^"]*"[^>]*>/g;
    var rowMatches = [];
    var match;
    var lastIndex = 0;
    
    // Znajdź wszystkie <div class="row">
    while ((match = rowPattern.exec(html)) !== null) {
      rowMatches.push(match.index);
    }
    
    console.log('[Zaluknij JS] Found ' + rowMatches.length + ' row sections');
    
    if (rowMatches.length <= (isSerial ? 3 : 1)) {
      console.log('[Zaluknij JS] Not enough sections');
      return null;
    }
    
    // Wyciągnij odpowiednią sekcję
    var targetIndex = isSerial ? 3 : 1;
    var sectionStart = rowMatches[targetIndex];
    var sectionEnd = rowMatches[targetIndex + 1] || html.length;
    var section = html.substring(sectionStart, sectionEnd);
    
    console.log('[Zaluknij JS] Section length: ' + section.length);
    
    // Znajdź wszystkie linki z klasą "item"
    var itemPattern = /<a[^>]*class="[^"]*item[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    
    while ((match = itemPattern.exec(section)) !== null) {
      var url = match[1];
      var itemContent = match[2];
      
      // Sprawdź czy to film czy serial (po URL)
      var isSerialUrl = url.indexOf('/serial-online/') !== -1;
      if (isSerial !== isSerialUrl) continue;
      
      // Wyciągnij tytuł
      var titleMatch = itemContent.match(/<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]*)<\/div>/);
      if (!titleMatch) continue;
      
      var itemTitle = titleMatch[1].trim().toLowerCase();
      
      console.log('[Zaluknij JS] Found item: ' + itemTitle + ' -> ' + url);
      
      // Sprawdź czy pasuje
      if (itemTitle.indexOf(searchTitle) !== -1 || searchTitle.indexOf(itemTitle) !== -1) {
        console.log('[Zaluknij JS] MATCH! Returning: ' + url);
        return {
          url: url,
          title: titleMatch[1].trim()
        };
      }
    }
    
    console.log('[Zaluknij JS] No match found');
    return null;
  },
  
  parseMediaLinks: function(params) {
    var html = params.html;
    var links = [];
    
    console.log('[Zaluknij JS] Parsing media links...');
    
    // Znajdź wszystkie <tr> w tabeli z linkami
    var tablePattern = /<table[^>]*id="link-list"[^>]*>([\s\S]*?)<\/table>/;
    var tableMatch = html.match(tablePattern);
    
    if (!tableMatch) {
      console.log('[Zaluknij JS] No link table found');
      return links;
    }
    
    var tableHtml = tableMatch[1];
    var rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    var match;
    
    while ((match = rowPattern.exec(tableHtml)) !== null) {
      var rowHtml = match[1];
      
      // Znajdź data-iframe
      var iframeMatch = rowHtml.match(/data-iframe="([^"]*)"/);
      if (!iframeMatch) continue;
      
      try {
        // Dekoduj base64 - prosty atob
        var encoded = iframeMatch[1];
        var decoded = this._base64Decode(encoded);
        
        // Wyciągnij URL z JSON
        var urlMatch = decoded.match(/"src":"([^"]*)"/);
        if (!urlMatch) continue;
        
        var url = urlMatch[1].replace(/\\\//g, '/');
        
        // Wyciągnij komórki tabeli
        var cells = [];
        var cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/g;
        var cellMatch;
        
        while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
          // Usuń tagi HTML
          var cellText = cellMatch[1].replace(/<[^>]*>/g, '').trim();
          cells.push(cellText);
        }
        
        if (cells.length < 4) continue;
        
        var lang = cells[2].toLowerCase();
        var qual = cells[3].toLowerCase();
        
        console.log('[Zaluknij JS] Found link: ' + qual + ' ' + lang);
        
        links.push({
          url: url,
          language: lang === 'lektor' ? 'Voice_Over' : 
                   lang === 'napisy pl' ? 'Subtitles' : 
                   lang === 'dubbing' ? 'Dubbing' : 
                   lang === 'lektor ivo' ? 'Voice_Over_IVO' : 'PL',
          quality: qual === 'wysoka' ? '1080p' : 
                  qual === 'średnia' ? '720p' : '360p',
          source: 'Zaluknij'
        });
      } catch (e) {
        console.error('[Zaluknij JS] Error parsing link: ' + e);
      }
    }
    
    console.log('[Zaluknij JS] Total links found: ' + links.length);
    return links;
  },
  
  parseEpisodeUrl: function(params) {
    var html = params.html;
    var season = params.season;
    var episode = params.episode;
    
    console.log('[Zaluknij JS] Finding S' + season + 'E' + episode);
    
    // Znajdź listę sezonów
    var episodeListPattern = /<ul[^>]*id="episode-list"[^>]*>([\s\S]*?)<\/ul>/;
    var listMatch = html.match(episodeListPattern);
    
    if (!listMatch) {
      console.log('[Zaluknij JS] No episode list found');
      return null;
    }
    
    var listHtml = listMatch[1];
    
    // Znajdź wszystkie <li> (sezony)
    var seasonPattern = /<li[^>]*>([\s\S]*?)<\/li>/g;
    var match;
    
    while ((match = seasonPattern.exec(listHtml)) !== null) {
      var seasonHtml = match[1];
      
      // Sprawdź numer sezonu
      var seasonNumMatch = seasonHtml.match(/Sezon (\d+)/);
      if (!seasonNumMatch) continue;
      
      var seasonNum = parseInt(seasonNumMatch[1]);
      if (seasonNum !== season) continue;
      
      console.log('[Zaluknij JS] Found season ' + seasonNum);
      
      // Znajdź odcinki w tym sezonie
      var epPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
      var epMatch;
      
      while ((epMatch = epPattern.exec(seasonHtml)) !== null) {
        var epUrl = epMatch[1];
        var epText = epMatch[2];
        
        // Wyciągnij numer odcinka (format: "1x01" lub "odcinek-1")
        var epNumMatch = epText.match(/\d+e(\d+)/i) || epText.match(/odcinek[^\d]*(\d+)/i);
        if (!epNumMatch) continue;
        
        var epNum = parseInt(epNumMatch[1]);
        
        console.log('[Zaluknij JS] Found episode ' + epNum);
        
        if (epNum === episode) {
          console.log('[Zaluknij JS] MATCH! Returning: ' + epUrl);
          return epUrl;
        }
      }
    }
    
    console.log('[Zaluknij JS] Episode not found');
    return null;
  },
  
  parseEpisodeLinks: function(params) {
    // To samo co parseMediaLinks
    return this.parseMediaLinks(params);
  },
  
  // Helper do dekodowania base64
  _base64Decode: function(str) {
    // Prosty base64 decode (może nie działać dla wszystkich przypadków)
    // ale wystarczy dla naszego przypadku
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var output = '';
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    
    // Usuń wszystkie znaki nie-base64
    str = str.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    
    while (i < str.length) {
      enc1 = chars.indexOf(str.charAt(i++));
      enc2 = chars.indexOf(str.charAt(i++));
      enc3 = chars.indexOf(str.charAt(i++));
      enc4 = chars.indexOf(str.charAt(i++));
      
      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;
      
      output = output + String.fromCharCode(chr1);
      
      if (enc3 !== 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 !== 64) {
        output = output + String.fromCharCode(chr3);
      }
    }
    
    return output;
  }
};

// Export
addon = ZaluknijAddon;
