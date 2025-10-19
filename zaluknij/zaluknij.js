// zaluknij.js - Addon dla Zaluknij.cc (BEZ HTTP REQUESTS)

// Te funkcje NIE są używane - Dart wykonuje HTTP
// Są tu tylko jako placeholder
function getMediaLinks(params) {
  // Ta funkcja nie jest używana - Dart wywołuje bezpośrednio findMediaUrl i extractLinks
  return [];
}

function getEpisodeMediaLinks(params) {
  // Ta funkcja nie jest używana - Dart wywołuje bezpośrednio findEpisodeUrl i extractLinks
  return [];
}

// Helper: Znajdź URL do filmu/serialu
function findMediaUrl(html, title, isSerial) {
  try {
    var sectionIndex = isSerial ? 3 : 1;
    var pattern = /<div class="row">[\s\S]*?<\/div>/g;
    var sections = html.match(pattern) || [];
    
    if (sections.length <= sectionIndex) return null;
    
    var section = sections[sectionIndex];
    var itemPattern = /<a href="([^"]+)"[^>]*class="item"[^>]*>[\s\S]*?<div class="title">([^<]+)<\/div>/g;
    
    var match;
    var searchTitle = title.toLowerCase();
    
    while ((match = itemPattern.exec(section)) !== null) {
      var url = match[1];
      var itemTitle = match[2].trim().toLowerCase();
      
      if (itemTitle.indexOf(searchTitle) !== -1 || searchTitle.indexOf(itemTitle) !== -1) {
        return url;
      }
    }
    
    return null;
  } catch (e) {
    console.log('Error in findMediaUrl: ' + e);
    return null;
  }
}

// Helper: Znajdź URL do odcinka
function findEpisodeUrl(html, seasonNumber, episodeNumber) {
  try {
    var seasonPattern = /<li[^>]*>\s*<span[^>]*>Sezon\s+(\d+)<\/span>\s*<ul[^>]*>([\s\S]*?)<\/ul>\s*<\/li>/g;
    
    var seasonMatch;
    while ((seasonMatch = seasonPattern.exec(html)) !== null) {
      var foundSeason = parseInt(seasonMatch[1]);
      
      if (foundSeason === seasonNumber) {
        var episodeList = seasonMatch[2];
        var episodePattern = /<a href="([^"]+)"[^>]*>.*?(\d+)e(\d+)/g;
        
        var episodeMatch;
        while ((episodeMatch = episodePattern.exec(episodeList)) !== null) {
          var foundEpisode = parseInt(episodeMatch[3]);
          
          if (foundEpisode === episodeNumber) {
            return episodeMatch[1];
          }
        }
      }
    }
    
    return null;
  } catch (e) {
    console.log('Error in findEpisodeUrl: ' + e);
    return null;
  }
}

// Helper: Wyciągnij linki z HTML
function extractLinks(html) {
  try {
    var links = [];
    var linkPattern = /<tr[^>]*>[\s\S]*?data-iframe="([^"]+)"[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/g;
    
    var match;
    while ((match = linkPattern.exec(html)) !== null) {
      try {
        var iframeData = match[1];
        var decoded = atob(iframeData);
        var jsonData = JSON.parse(decoded);
        var url = jsonData.src || jsonData.url;
        
        if (!url) continue;
        
        var lang = match[3].trim().toLowerCase();
        var quality = match[4].trim().toLowerCase();
        
        var languageMap = {
          'lektor': 'Voice_Over',
          'napisy pl': 'Subtitles',
          'dubbing': 'Dubbing',
          'lektor ivo': 'Voice_Over_IVO'
        };
        
        var qualityMap = {
          'wysoka': '1080p',
          'średnia': '720p',
          'niska': '360p'
        };
        
        links.push({
          url: url,
          language: languageMap[lang] || 'PL',
          quality: qualityMap[quality] || '720p'
        });
      } catch (e) {
        // Skip invalid entries
      }
    }
    
    return links;
  } catch (e) {
    console.log('Error in extractLinks: ' + e);
    return [];
  }
}

// Base64 decode
function atob(str) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  var output = '';
  
  str = str.replace(/=+$/, '');
  
  for (var i = 0; i < str.length;) {
    var enc1 = chars.indexOf(str.charAt(i++));
    var enc2 = chars.indexOf(str.charAt(i++));
    var enc3 = chars.indexOf(str.charAt(i++));
    var enc4 = chars.indexOf(str.charAt(i++));
    
    var chr1 = (enc1 << 2) | (enc2 >> 4);
    var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    var chr3 = ((enc3 & 3) << 6) | enc4;
    
    output += String.fromCharCode(chr1);
    
    if (enc3 !== 64) {
      output += String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output += String.fromCharCode(chr3);
    }
  }
  
  return output;
}
