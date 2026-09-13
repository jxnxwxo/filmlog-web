import { query } from "@/lib/db";
import { Movie } from "@/lib/i18n";

interface MovieRow {
  id: number;
  title_kr: string;
  title_en: string;
  title_ja: string;
  year: string | null;
  country: Movie["country"];
  genre: Movie["genre"];
  grade: string | null;
  casting: Movie["casting"];
  cast_search: string;
  overview: Movie["overview"];
  vote_average: string | null;
  poster_key: Movie["posterKey"];
  comment: string | null;
  category: "movie" | "drama";
  tmdb_id: number;
  media_type: "movie" | "tv";
}

export async function getAllMovies(): Promise<Movie[]> {
  const rows = await query<MovieRow>(
    `SELECT id, title_kr, title_en, title_ja, year, country, genre, grade,
            casting, cast_search, overview, vote_average, poster_key, comment,
            category, tmdb_id, media_type
     FROM movies
     ORDER BY title_kr`
  );

  return rows.map((r) => ({
    id: r.id,
    titleKr: r.title_kr,
    titleEn: r.title_en,
    titleJa: r.title_ja,
    year: r.year,
    country: r.country,
    genre: r.genre,
    grade: r.grade,
    casting: r.casting,
    castSearch: r.cast_search,
    overview: r.overview,
    voteAverage: r.vote_average,
    posterKey: r.poster_key,
    comment: r.comment,
    category: r.category,
    tmdbId: r.tmdb_id,
    mediaType: r.media_type,
  }));
}
