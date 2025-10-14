function getManifest() {
  return {
    id: "example_movies",
    name: "Example Movies",
    version: "1.0.0",
    author: "TwojeImie",
    description: "Przykładowy addon z filmami"
  };
}

function search(query) {
  // Symulacja wyszukiwania - w prawdziwym addonie użyjesz fetch/XMLHttpRequest
  const movies = [
    {
      title: "The Matrix " + query,
      year: "1999",
      poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      url: "https://example.com/matrix"
    },
    {
      title: "Inception " + query,
      year: "2010",
      poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      url: "https://example.com/inception"
    },
    {
      title: "golost " + query,
      year: "199904",
      poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      url: "https://example.com/matreseix"
    },
    {
      title: "Interstellar " + query,
      year: "2014",
      poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      url: "https://example.com/interstellar"
    }
  ];
  
  return movies;
}

function getMovieDetails(url) {
  // W prawdziwym addonie parsowałbyś stronę
  return {
    title: "Film Example",
    description: "To jest przykładowy opis filmu. W prawdziwym addonie pobierałbyś dane ze strony: " + url,
    poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    streamLinks: [
      {
        quality: "720p",
        url: "https://example.com/stream/720"
      },
      {
        quality: "1080p",
        url: "https://example.com/stream/1080"
      }
    ]
  };
}
