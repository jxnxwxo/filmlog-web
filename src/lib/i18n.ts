export type Lang = "ko" | "en" | "ja";

export const LOCALE: Record<Lang, string> = { ko: "ko", en: "en", ja: "ja" };

export interface I18nStrings {
  siteTitle: string;
  siteSub: string;
  tabMovie: string;
  tabDrama: string;
  countryAll: string;
  countryKr: string;
  countryForeign: string;
  searchPlaceholder: string;
  sortTitle: string;
  sortYearDesc: string;
  sortYearAsc: string;
  sortGradeDesc: string;
  sortTmdbDesc: string;
  viewText: string;
  viewPoster: string;
  listHeadTitle: string;
  listHeadYear: string;
  listHeadGenre: string;
  listHeadCast: string;
  listHeadGrade: string;
  shownSuffix: string;
  emptyState: string;
  footNote: string;
  footSuffix: string;
  myRating: string;
  castLabel: string;
  unrated: string;
  noInfo: string;
  noOverview: string;
  adminLink: string;
  myNote: string;
  adminPanel: string;
  logout: string;
}

export const I18N: Record<Lang, I18nStrings> = {
  ko: {
    siteTitle: "FILM & DRAMA ARCHIVE",
    siteSub: "시청했던 영화/드라마 기록",
    tabMovie: "영화",
    tabDrama: "드라마",
    countryAll: "전체",
    countryKr: "한국",
    countryForeign: "해외",
    searchPlaceholder: "제목, 출연진으로 검색…",
    sortTitle: "제목순",
    sortYearDesc: "연도 최신순",
    sortYearAsc: "연도 오래된순",
    sortGradeDesc: "내 평점 높은순",
    sortTmdbDesc: "TMDB 평점 높은순",
    viewText: "텍스트",
    viewPoster: "포스터",
    listHeadTitle: "제목",
    listHeadYear: "연도 · 국가",
    listHeadGenre: "장르",
    listHeadCast: "배우",
    listHeadGrade: "평점",
    shownSuffix: "편 표시 중",
    emptyState: "일치하는 작품이 없습니다.",
    footNote: "개인 기록 + TMDb(The Movie Database) API 매칭",
    footSuffix: "건",
    myRating: "내 평점",
    castLabel: "출연",
    unrated: "미평가",
    noInfo: "정보 없음",
    noOverview: "줄거리 정보가 없습니다.",
    adminLink: "관리자",
    myNote: "한줄평",
    adminPanel: "관리자 화면",
    logout: "로그아웃",
  },
  en: {
    siteTitle: "FILM & DRAMA ARCHIVE",
    siteSub: "Movies & dramas I've watched",
    tabMovie: "Movies",
    tabDrama: "Dramas",
    countryAll: "All",
    countryKr: "Korean",
    countryForeign: "International",
    searchPlaceholder: "Search by title or cast…",
    sortTitle: "Title",
    sortYearDesc: "Newest",
    sortYearAsc: "Oldest",
    sortGradeDesc: "My Rating",
    sortTmdbDesc: "TMDB Rating",
    viewText: "Text",
    viewPoster: "Poster",
    listHeadTitle: "Title",
    listHeadYear: "Year · Country",
    listHeadGenre: "Genre",
    listHeadCast: "Cast",
    listHeadGrade: "Rating",
    shownSuffix: " shown",
    emptyState: "No matching titles.",
    footNote: "Personal log + TMDb (The Movie Database) API match",
    footSuffix: "",
    myRating: "My Rating",
    castLabel: "Cast",
    unrated: "Unrated",
    noInfo: "No info",
    noOverview: "No synopsis available.",
    adminLink: "Admin",
    myNote: "My Note",
    adminPanel: "Admin Panel",
    logout: "Log out",
  },
  ja: {
    siteTitle: "FILM & DRAMA ARCHIVE",
    siteSub: "視聴した映画・ドラマの記録",
    tabMovie: "映画",
    tabDrama: "ドラマ",
    countryAll: "すべて",
    countryKr: "韓国",
    countryForeign: "海外",
    searchPlaceholder: "タイトル・出演者で検索…",
    sortTitle: "タイトル順",
    sortYearDesc: "新しい順",
    sortYearAsc: "古い順",
    sortGradeDesc: "自己評価順",
    sortTmdbDesc: "TMDB評価順",
    viewText: "テキスト",
    viewPoster: "ポスター",
    listHeadTitle: "タイトル",
    listHeadYear: "年・国",
    listHeadGenre: "ジャンル",
    listHeadCast: "出演者",
    listHeadGrade: "評価",
    shownSuffix: "件表示中",
    emptyState: "該当する作品がありません。",
    footNote: "個人記録 + TMDb(The Movie Database) APIマッチング",
    footSuffix: "件",
    myRating: "自己評価",
    castLabel: "出演",
    unrated: "未評価",
    noInfo: "情報なし",
    noOverview: "あらすじ情報がありません。",
    adminLink: "管理者",
    myNote: "ひとこと感想",
    adminPanel: "管理画面",
    logout: "ログアウト",
  },
};

export interface Movie {
  id: number;
  titleKr: string;
  titleEn: string;
  titleJa: string;
  year: string | null;
  country: { ko: string; en: string; ja: string };
  genre: { ko: string[]; en: string[]; ja: string[] };
  grade: number | string | null;
  casting: { ko: string; en: string; ja: string };
  castSearch: string;
  overview: { ko: string; en: string; ja: string };
  voteAverage: number | string | null;
  posterKey: { ko: string | null; en: string | null; ja: string | null };
  comment: string | null;
  category: "movie" | "drama";
  tmdbId: number;
  mediaType: "movie" | "tv";
}

const TITLE_FIELD: Record<Lang, keyof Movie> = { ko: "titleKr", en: "titleEn", ja: "titleJa" };

export function getTitle(item: Movie, lang: Lang): string {
  return (item[TITLE_FIELD[lang]] as string) || item.titleKr;
}
export function getGenre(item: Movie, lang: Lang): string[] {
  return item.genre?.[lang] || [];
}
export function getOverview(item: Movie, lang: Lang): string {
  return item.overview?.[lang] || "";
}
export function getCountry(item: Movie, lang: Lang): string {
  return item.country?.[lang] || "";
}
export function getCasting(item: Movie, lang: Lang): string {
  return item.casting?.[lang] || "";
}
export function getTopCast(item: Movie, lang: Lang, n: number = 2): string {
  const full = getCasting(item, lang);
  if (!full) return "";
  return full.split(",").map((s) => s.trim()).slice(0, n).join(", ");
}
export const LANG_FLAG: Record<Lang, string> = { ko: "🇰🇷", en: "🇺🇸", ja: "🇯🇵" };

export function posterUrl(path: string | null | undefined, size: string = "w185"): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
