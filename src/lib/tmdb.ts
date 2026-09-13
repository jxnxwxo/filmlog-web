const API_KEY = process.env.TMDB_API_KEY;
const BASE = "https://api.themoviedb.org/3";

export type MediaType = "movie" | "tv";

export interface SearchCandidate {
  id: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  year: string;
  posterPath: string | null;
  popularity: number;
  overview: string;
}

interface TmdbGenre {
  name: string;
}
interface TmdbCountry {
  iso_3166_1?: string;
  name?: string;
}
interface TmdbCastMember {
  name: string;
}
interface TmdbDetails {
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  vote_average?: number;
  genres?: TmdbGenre[];
  production_countries?: TmdbCountry[];
  origin_country?: string[];
}
interface TmdbSearchResult {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  popularity: number;
  overview: string;
}

const COUNTRY_I18N: Record<string, { ko: string; en: string; ja: string }> = {
  "South Korea": { ko: "한국", en: "South Korea", ja: "韓国" },
  KR: { ko: "한국", en: "South Korea", ja: "韓国" },
  "United States of America": { ko: "미국", en: "United States", ja: "アメリカ" },
  US: { ko: "미국", en: "United States", ja: "アメリカ" },
  Japan: { ko: "일본", en: "Japan", ja: "日本" },
  JP: { ko: "일본", en: "Japan", ja: "日本" },
  "United Kingdom": { ko: "영국", en: "United Kingdom", ja: "イギリス" },
  GB: { ko: "영국", en: "United Kingdom", ja: "イギリス" },
  France: { ko: "프랑스", en: "France", ja: "フランス" },
  FR: { ko: "프랑스", en: "France", ja: "フランス" },
  China: { ko: "중국", en: "China", ja: "中国" },
  CN: { ko: "중국", en: "China", ja: "中国" },
  Taiwan: { ko: "대만", en: "Taiwan", ja: "台湾" },
  TW: { ko: "대만", en: "Taiwan", ja: "台湾" },
  India: { ko: "인도", en: "India", ja: "インド" },
  IN: { ko: "인도", en: "India", ja: "インド" },
  Italy: { ko: "이탈리아", en: "Italy", ja: "イタリア" },
  IT: { ko: "이탈리아", en: "Italy", ja: "イタリア" },
  Germany: { ko: "독일", en: "Germany", ja: "ドイツ" },
  DE: { ko: "독일", en: "Germany", ja: "ドイツ" },
  Canada: { ko: "캐나다", en: "Canada", ja: "カナダ" },
  CA: { ko: "캐나다", en: "Canada", ja: "カナダ" },
  Australia: { ko: "호주", en: "Australia", ja: "オーストラリア" },
  AU: { ko: "호주", en: "Australia", ja: "オーストラリア" },
  Spain: { ko: "스페인", en: "Spain", ja: "スペイン" },
  ES: { ko: "스페인", en: "Spain", ja: "スペイン" },
  "Hong Kong": { ko: "홍콩", en: "Hong Kong", ja: "香港" },
  HK: { ko: "홍콩", en: "Hong Kong", ja: "香港" },
};

function normalizeCountry(raw: string) {
  return COUNTRY_I18N[raw] || { ko: raw, en: raw, ja: raw };
}

export async function searchTmdb(
  query: string,
  mediaType: MediaType
): Promise<SearchCandidate[]> {
  const url = `${BASE}/search/${mediaType}?api_key=${API_KEY}&language=ko-KR&query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const results = (data.results || []) as TmdbSearchResult[];
  return results
    .map((r) => ({
      id: r.id,
      mediaType,
      title: (mediaType === "movie" ? r.title : r.name) || "",
      originalTitle: (mediaType === "movie" ? r.original_title : r.original_name) || "",
      year: ((mediaType === "movie" ? r.release_date : r.first_air_date) || "").slice(0, 4),
      posterPath: r.poster_path,
      popularity: r.popularity,
      overview: r.overview,
    }))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 10);
}

async function getDetails(id: number, mediaType: MediaType, lang: string): Promise<TmdbDetails> {
  const url = `${BASE}/${mediaType}/${id}?api_key=${API_KEY}&language=${lang}`;
  const res = await fetch(url);
  if (!res.ok) return {};
  return res.json();
}

async function getCastNames(id: number, mediaType: MediaType, lang: string): Promise<string[]> {
  const url = `${BASE}/${mediaType}/${id}/credits?api_key=${API_KEY}&language=${lang}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const cast = (data.cast || []) as TmdbCastMember[];
  return cast.slice(0, 6).map((c) => c.name);
}

export interface FullMovieData {
  tmdbId: number;
  mediaType: MediaType;
  titleKr: string;
  titleEn: string;
  titleJa: string;
  year: string;
  country: { ko: string; en: string; ja: string };
  genre: { ko: string[]; en: string[]; ja: string[] };
  overview: { ko: string; en: string; ja: string };
  casting: { ko: string; en: string; ja: string };
  voteAverage: number | null;
  posterKey: { ko: string | null; en: string | null; ja: string | null };
}

export async function fetchFullMovieData(
  id: number,
  mediaType: MediaType
): Promise<FullMovieData> {
  const [ko, en, ja, castKoArr, castEnArr, castJaArr] = await Promise.all([
    getDetails(id, mediaType, "ko-KR"),
    getDetails(id, mediaType, "en-US"),
    getDetails(id, mediaType, "ja-JP"),
    getCastNames(id, mediaType, "ko-KR"),
    getCastNames(id, mediaType, "en-US"),
    getCastNames(id, mediaType, "ja-JP"),
  ]);

  const titleOf = (d: TmdbDetails) => (mediaType === "movie" ? d.title : d.name) || "";
  const dateOf = (d: TmdbDetails) => (mediaType === "movie" ? d.release_date : d.first_air_date) || "";
  const countriesOf = (d: TmdbDetails) =>
    mediaType === "movie"
      ? (d.production_countries || []).map((c) => c.iso_3166_1 || c.name || "")
      : d.origin_country || [];

  const rawCountry = countriesOf(ko)[0] || countriesOf(en)[0] || "";
  const country = normalizeCountry(rawCountry);

  const castKo = castKoArr.join(", ");
  const castEn = castEnArr.join(", ");
  const castJa = castJaArr.join(", ");

  return {
    tmdbId: id,
    mediaType,
    titleKr: titleOf(ko) || titleOf(en),
    titleEn: titleOf(en) || titleOf(ko),
    titleJa: titleOf(ja) || titleOf(en),
    year: (dateOf(ko) || dateOf(en)).slice(0, 4),
    country,
    genre: {
      ko: (ko.genres || []).map((g) => g.name),
      en: (en.genres || []).map((g) => g.name),
      ja: (ja.genres || []).map((g) => g.name),
    },
    overview: { ko: ko.overview || "", en: en.overview || "", ja: ja.overview || "" },
    casting: {
      ko: castKo || castEn || castJa,
      en: castEn || castKo || castJa,
      ja: castJa || castEn || castKo,
    },
    voteAverage: ko.vote_average ?? en.vote_average ?? null,
    posterKey: {
      ko: ko.poster_path ?? null,
      en: en.poster_path ?? ko.poster_path ?? null,
      ja: ja.poster_path ?? ko.poster_path ?? null,
    },
  };
}

export function posterUrl(path: string | null | undefined, size: string = "w185") {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
