var ZaluknijAddon = {
  buildSearchUrl: function(params) {
    return "https://zaluknij.cc/wyszukiwarka?phrase=" + encodeURIComponent(params.title);
  },
  
  parseSearch: function(params) {
    var html = params.html;
    var isSerial = params.isSerial;
    
    // Proste parsowanie przez regex
    var sectionMatch = isSerial 
      ? html.match(/<div class="row"[^>]*>([\s\S]*?)<\/div>/g)
      : html.match(/<div class="row"[^>]*>([\s\S]*?)<\/div>/g);
    
    if (!sectionMatch || sectionMatch.length <= (isSerial ? 3 : 1)) return null;
    
    var section = isSerial ? sectionMatch[3] : sectionMatch[1];
    var itemMatches = section.match(/<a[^>]*class="[^"]*item[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g);
    
    if (!itemMatches) return null;
    
    for (var i = 0; i < itemMatches.length; i++) {
      var itemHtml = itemMatches[i];
      var urlMatch = itemHtml.match(/href="([^"]*)"/);
      var titleMatch = itemHtml.match(/<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]*)<\/div>/);
      
      if (!urlMatch || !titleMatch) continue;
      
      var url = urlMatch[1];
      var itemTitle = titleMatch[1].trim().toLowerCase();
      var searchTitle = params.title.toLowerCase();
      
      if (itemTitle.indexOf(searchTitle) !== -1 || searchTitle.indexOf(itemTitle) !== -1) {
        return {url: url, title: titleMatch[1].trim()};
      }
    }
    
    return null;
  },
  
  parseMediaLinks: function(params) {
    var html = params.html;
    var links = [];
    
    // Znajdź tabelę z linkami
    var rowMatches = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
    if (!rowMatches) return links;
    
    for (var i = 0; i < rowMatches.length; i++) {
      var row = rowMatches[i];
      var iframeMatch = row.match(/data-iframe="([^"]*)"/);
      if (!iframeMatch) continue;
      
      try {
        // Dekoduj base64
        var decoded = atob(iframeMatch[1]);
        var urlMatch = decoded.match(/"src":"([^"]*)"/);
        if (!urlMatch) continue;
        
        var url = urlMatch[1].replace(/\\\//g, '/');
        
        // Wyciągnij język i jakość
        var cells = row.match(/<td[^>]*>([^<]*)<\/td>/g);
        if (!cells || cells.length < 4) continue;
        
        var lang = cells[2].replace(/<[^>]*>/g, '').trim().toLowerCase();
        var qual = cells[3].replace(/<[^>]*>/g, '').trim().toLowerCase();
        
        links.push({
          url: url,
          language: lang === 'lektor' ? 'Voice_Over' : 
                   lang === 'napisy pl' ? 'Subtitles' : 
                   lang === 'dubbing' ? 'Dubbing' : 'PL',
          quality: qual === 'wysoka' ? '1080p' : 
                  qual === 'średnia' ? '720p' : '360p',
          source: 'Zaluknij'
        });
      } catch (e) {}
    }
    
    return links;
  },
  
  parseEpisodeUrl: function(params) {
    var html = params.html;
    var season = params.season;
    var episode = params.episode;
    
    // Znajdź listę sezonów
    var seasonMatches = html.match(/<li[^>]*>([\s\S]*?)<\/li>/g);
    if (!seasonMatches) return null;
    
    for (var i = 0; i < seasonMatches.length; i++) {
      var seasonHtml = seasonMatches[i];
      var seasonNumMatch = seasonHtml.match(/Sezon (\d+)/);
      if (!seasonNumMatch) continue;
      
      var seasonNum = parseInt(seasonNumMatch[1]);
      if (seasonNum !== season) continue;
      
      // Znajdź odcinki w tym sezonie
      var epMatches = seasonHtml.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g);
      if (!epMatches) continue;
      
      for (var j = 0; j < epMatches.length; j++) {
        var epHtml = epMatches[j];
        var epNumMatch = epHtml.match(/\d+e(\d+)/);
        var epUrlMatch = epHtml.match(/href="([^"]*)"/);
        
        if (!epNumMatch || !epUrlMatch) continue;
        
        var epNum = parseInt(epNumMatch[1]);
        if (epNum === episode) {
          return epUrlMatch[1];
        }
      }
    }
    
    return null;
  },
  
  parseEpisodeLinks: function(params) {
    return this.parseMediaLinks(params);
  }
};

// Export
addon = ZaluknijAddon;
