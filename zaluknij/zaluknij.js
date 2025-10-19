// zaluknij.js - Addon dla Zaluknij.cc

const BASE_URL = 'https://zaluknij.cc';

// Główna funkcja do pobierania linków do filmów
async function getMediaLinks(params) {
  const { tmdbId, title, originalTitle, releaseYear, isSerial } = params;
  
  try {
    // Wyszukaj media
    const searchUrl = `${BASE_URL}/wyszukiwarka?phrase=${encodeURIComponent(title)}`;
    const searchHtml = await httpGet(searchUrl);
    
    if (!searchHtml) return [];
    
    // Parse HTML i znajdź właściwy film/serial
    const mediaUrl = findMediaUrl(searchHtml, title, isSerial);
    if (!mediaUrl) return [];
    
    // Pobierz stronę z linkami
    const mediaHtml = await httpGet(mediaUrl);
    if (!mediaHtml) return [];
    
    // Wyciągnij linki
    return extractLinks(mediaHtml);
  } catch (error) {
    console.log('Error in getMediaLinks: ' + error);
    return [];
  }
}

// Funkcja do pobierania linków do odcinków
async function getEpisodeMediaLinks(params) {
  const { tmdbId, title, originalTitle, releaseYear, seasonNumber, episodeNumber } = params;
  
  try {
    // Wyszukaj serial
    const searchUrl = `${BASE_URL}/wyszukiwarka?phrase=${encodeURIComponent(title)}`;
    const searchHtml = await httpGet(searchUrl);
    
    if (!searchHtml) return [];
    
    // Znajdź serial
    const seriesUrl = findMediaUrl(searchHtml, title, true);
    if (!seriesUrl) return [];
    
    // Pobierz stronę serialu
    const seriesHtml = await httpGet(seriesUrl);
    if (!seriesHtml) return [];
    
    // Znajdź URL odcinka
    const episodeUrl = findEpisodeUrl(seriesHtml, seasonNumber, episodeNumber);
    if (!episodeUrl) return [];
    
    // Pobierz stronę odcinka
    const episodeHtml = await httpGet(episodeUrl);
    if (!episodeHtml) return [];
    
    // Wyciągnij linki
    return extractLinks(episodeHtml);
  } catch (error) {
    console.log('Error in getEpisodeMediaLinks: ' + error);
    return [];
  }
}

// Helper: Znajdź URL do filmu/serialu
function findMediaUrl(html, title, isSerial) {
  const sectionIndex = isSerial ? 3 : 1;
  const pattern = new RegExp(`<div class="row">(?:(?!</div>).)*?</div>`, 'gs');
  const sections = html.match(pattern) || [];
  
  if (sections.length <= sectionIndex) return null;
  
  const section = sections[sectionIndex];
  const itemPattern = /<a href="([^"]+)"[^>]*class="item"[^>]*>[\s\S]*?<div class="title">([^<]+)<\/div>/g;
  
  let match;
  while ((match = itemPattern.exec(section)) !== null) {
    const url = match[1];
    const itemTitle = match[2].trim().toLowerCase();
    const searchTitle = title.toLowerCase();
    
    if (itemTitle.includes(searchTitle) || searchTitle.includes(itemTitle)) {
      return url;
    }
  }
  
  return null;
}

// Helper: Znajdź URL do odcinka
function findEpisodeUrl(html, seasonNumber, episodeNumber) {
  const seasonPattern = new RegExp(`<li[^>]*>\\s*<span[^>]*>Sezon\\s+(\\d+)</span>\\s*<ul[^>]*>([\\s\\S]*?)</ul>\\s*</li>`, 'g');
  
  let seasonMatch;
  while ((seasonMatch = seasonPattern.exec(html)) !== null) {
    const foundSeason = parseInt(seasonMatch[1]);
    
    if (foundSeason === seasonNumber) {
      const episodeList = seasonMatch[2];
      const episodePattern = /<a href="([^"]+)"[^>]*>.*?(\d+)e(\d+)/g;
      
      let episodeMatch;
      while ((episodeMatch = episodePattern.exec(episodeList)) !== null) {
        const foundEpisode = parseInt(episodeMatch[3]);
        
        if (foundEpisode === episodeNumber) {
          return episodeMatch[1];
        }
      }
    }
  }
  
  return null;
}

// Helper: Wyciągnij linki z HTML
function extractLinks(html) {
  const links = [];
  const linkPattern = /<tr[^>]*>[\s\S]*?data-iframe="([^"]+)"[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/g;
  
  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    try {
      const iframeData = match[1];
      const decoded = atob(iframeData);
      const jsonData = JSON.parse(decoded);
      const url = jsonData.src || jsonData.url;
      
      if (!url) continue;
      
      const lang = match[3].trim().toLowerCase();
      const quality = match[4].trim().toLowerCase();
      
      const languageMap = {
        'lektor': 'Voice_Over',
        'napisy pl': 'Subtitles',
        'dubbing': 'Dubbing',
        'lektor ivo': 'Voice_Over_IVO'
      };
      
      const qualityMap = {
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
}

// Helper functions (implemented by Dart)
function httpGet(url, headers) {
  // This will be replaced by Dart implementation
  return null;
}

function httpPost(url, data, headers) {
  // This will be replaced by Dart implementation
  return null;
}

function atob(str) {
  // Base64 decode
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  
  str = str.replace(/=+$/, '');
  
  for (let i = 0; i < str.length;) {
    const enc1 = chars.indexOf(str.charAt(i++));
    const enc2 = chars.indexOf(str.charAt(i++));
    const enc3 = chars.indexOf(str.charAt(i++));
    const enc4 = chars.indexOf(str.charAt(i++));
    
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    
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
