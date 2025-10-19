// @id: example_movies
// @name: Example Movies
// @description: Przykładowy dodatek z filmami
// @version: 1.0.0
// @author: YourName

List<Map<String, dynamic>> searchMovies(String query) {
  final movies = getPopularMovies();
  return movies.where((movie) {
    final title = movie['title'].toString().toLowerCase();
    return title.contains(query.toLowerCase());
  }).toList();
}

List<Map<String, dynamic>> getPopularMovies() {
  return [
    {
      'id': '1',
      'title': 'Inception',
      'description': 'Dom Cobb kradnie sekrety z podświadomości podczas snu.',
      'posterUrl': 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
      'rating': 8.8,
    },
    {
      'id': '2',
      'title': 'The Matrix',
      'description': 'Programista odkrywa prawdę o rzeczywistości.',
      'posterUrl': 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
      'rating': 8.7,
    },
    {
      'id': '3',
      'title': 'Interstellar',
      'description': 'Podróż przez przestrzeń kosmiczną w poszukiwaniu nowego domu.',
      'posterUrl': 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      'rating': 8.6,
    },
    {
      'id': '4',
      'title': 'The Dark Knight',
      'description': 'Batman walczy z Jokerem o duszę Gotham.',
      'posterUrl': 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      'rating': 9.0,
    },
    {
      'id': '5',
      'title': 'Pulp Fiction',
      'description': 'Przeplatające się historie przestępców w Los Angeles.',
      'posterUrl': 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
      'rating': 8.9,
    },
  ];
}

String? getStreamUrl(String movieId) {
  // W prawdziwym addonie tutaj byłaby logika pobierania URL do streamu
  return 'https://example.com/stream/$movieId.mp4';
}

Map<String, dynamic>? getMovieDetails(String id) {
  final movies = getPopularMovies();
  try {
    return movies.firstWhere((m) => m['id'] == id);
  } catch (e) {
    return null;
  }
}
