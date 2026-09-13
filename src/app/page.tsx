"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  I18N,
  LOCALE,
  Lang,
  Movie,
  getTitle,
  getGenre,
  getOverview,
  getCountry,
  getCasting,
  getTopCast,
  posterUrl,
} from "@/lib/i18n";
import { FlagKR, FlagUS, FlagJP } from "@/components/Flags";

const LANG_FLAG_ICON: Record<Lang, React.ComponentType<{ size?: number }>> = {
  ko: FlagKR,
  en: FlagUS,
  ja: FlagJP,
};

type Category = "movie" | "drama";
type CountryFilter = "all" | "kr" | "foreign";
type ViewMode = "text" | "poster";
type SortMode = "title" | "year-desc" | "year-asc" | "grade-desc" | "tmdb-desc";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

function SunMoonIcon({ dark }: { dark: boolean }) {
  return dark ? (
    <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  ) : (
    <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
    </svg>
  );
}

export default function Home() {
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>("movie");
  const [country, setCountry] = useState<CountryFilter>("all");
  const [view, setView] = useState<ViewMode>("text");
  const [sort, setSort] = useState<SortMode>("title");
  const [lang, setLang] = useState<Lang>("ko");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [selected, setSelected] = useState<Movie | null>(null);

  const t = I18N[lang];

  useEffect(() => {
    fetch("/api/movies")
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("filmlog-theme");
    } catch {}
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    if (theme) document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
  }, [theme]);

  function toggleTheme() {
    const isDark =
      theme === "dark" ||
      (!theme && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("filmlog-theme", next);
    } catch {}
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.filter((d) => {
      if (d.category !== category) return false;
      const isKr = d.country?.ko === "한국";
      if (country === "kr" && !isKr) return false;
      if (country === "foreign" && isKr) return false;
      if (q) {
        const hay = [d.titleKr, d.titleEn, d.titleJa, d.castSearch].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const num = (v: unknown) => {
      const n = parseFloat(String(v));
      return isNaN(n) ? null : n;
    };
    list = [...list];
    switch (sort) {
      case "year-desc":
        list.sort((a, b) => (num(b.year) ?? -1) - (num(a.year) ?? -1));
        break;
      case "year-asc":
        list.sort((a, b) => (num(a.year) ?? 9999) - (num(b.year) ?? 9999));
        break;
      case "grade-desc":
        list.sort((a, b) => (num(b.grade) ?? -1) - (num(a.grade) ?? -1));
        break;
      case "tmdb-desc":
        list.sort((a, b) => (num(b.voteAverage) ?? -1) - (num(a.voteAverage) ?? -1));
        break;
      default:
        list.sort((a, b) => getTitle(a, lang).localeCompare(getTitle(b, lang), LOCALE[lang]));
    }
    return list;
  }, [items, category, country, query, sort, lang]);

  const countMovie = items.filter((d) => d.category === "movie").length;
  const countDrama = items.filter((d) => d.category === "drama").length;
  const graded = items.map((d) => parseFloat(String(d.grade))).filter((n) => !isNaN(n));
  const avgGrade = graded.length ? (graded.reduce((a, b) => a + b, 0) / graded.length).toFixed(1) : "0.0";

  return (
    <>
      <div className="hero">
        <div>
          <h1>{t.siteTitle}</h1>
          <p>{t.siteSub(items.length)}</p>
        </div>
        <div className="hero-side">
          <div className="hero-tools">
            <div className="segmented lang-segmented">
              {(["ko", "en", "ja"] as Lang[]).map((l) => {
                const FlagIcon = LANG_FLAG_ICON[l];
                return (
                  <button
                    key={l}
                    className={lang === l ? "active" : ""}
                    onClick={() => setLang(l)}
                    aria-label={l}
                    title={l.toUpperCase()}
                  >
                    <FlagIcon size={20} />
                  </button>
                );
              })}
            </div>
            <button className="theme-toggle" aria-label="theme" onClick={toggleTheme}>
              <SunMoonIcon dark={theme === "dark"} />
            </button>
            <Link href="/admin" className="admin-link">
              {t.adminLink}
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <b>{items.length}</b>
              <span>{t.statTotal}</span>
            </div>
            <div className="stat">
              <b>{avgGrade}</b>
              <span>{t.statAvg}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="controls">
        <div className="controls-inner">
          <div className="segmented">
            <button className={category === "movie" ? "active" : ""} data-cat="movie" onClick={() => setCategory("movie")}>
              {t.tabMovie} <span className="n">{countMovie}</span>
            </button>
            <button className={category === "drama" ? "active" : ""} data-cat="drama" onClick={() => setCategory("drama")}>
              {t.tabDrama} <span className="n">{countDrama}</span>
            </button>
          </div>
          <div className="segmented">
            <button className={country === "all" ? "active" : ""} onClick={() => setCountry("all")}>
              {t.countryAll}
            </button>
            <button className={country === "kr" ? "active" : ""} onClick={() => setCountry("kr")}>
              {t.countryKr}
            </button>
            <button className={country === "foreign" ? "active" : ""} onClick={() => setCountry("foreign")}>
              {t.countryForeign}
            </button>
          </div>
          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
            <option value="title">{t.sortTitle}</option>
            <option value="year-desc">{t.sortYearDesc}</option>
            <option value="year-asc">{t.sortYearAsc}</option>
            <option value="grade-desc">{t.sortGradeDesc}</option>
            <option value="tmdb-desc">{t.sortTmdbDesc}</option>
          </select>
          <div className="segmented">
            <button className={view === "text" ? "active" : ""} onClick={() => setView("text")}>
              {t.viewText}
            </button>
            <button className={view === "poster" ? "active" : ""} onClick={() => setView("poster")}>
              {t.viewPoster}
            </button>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="grid-meta">
          {filtered.length}
          {t.shownSuffix}
        </div>

        {loading ? null : filtered.length === 0 ? (
          <div className="empty-state">{t.emptyState}</div>
        ) : view === "text" ? (
          <>
            <div className="list-head">
              <div>{t.listHeadTitle}</div>
              <div>{t.listHeadYear}</div>
              <div>{t.listHeadGenre}</div>
              <div>{t.listHeadCast}</div>
              <div>{t.listHeadGrade}</div>
              <div>{t.myNote}</div>
            </div>
            <div>
              {filtered.map((item) => (
                <ListRow key={item.id} item={item} lang={lang} t={t} onOpen={() => setSelected(item)} />
              ))}
            </div>
          </>
        ) : (
          <div className="grid">
            {filtered.map((item) => (
              <PosterCard key={item.id} item={item} lang={lang} onOpen={() => setSelected(item)} />
            ))}
          </div>
        )}

        <footer className="note">
          DATA — {t.footNote} · {filtered.length}
          {t.footSuffix}
        </footer>
      </div>

      {selected && (
        <MovieModal item={selected} lang={lang} t={t} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

function ListRow({
  item,
  lang,
  t,
  onOpen,
}: {
  item: Movie;
  lang: Lang;
  t: (typeof I18N)["ko"];
  onOpen: () => void;
}) {
  const title = getTitle(item, lang);
  const metaLine = [item.year, getCountry(item, lang)].filter(Boolean).join(" · ") || "—";
  const grade = item.grade ? parseFloat(String(item.grade)).toFixed(1) : null;
  return (
    <button className="list-row" onClick={onOpen}>
      <div>
        <div className="row-title-kr">{title}</div>
        {item.titleKr && title !== item.titleKr && <div className="row-title-en">{item.titleKr}</div>}
      </div>
      <div className="row-meta">{metaLine}</div>
      <div className="row-genre">
        {getGenre(item, lang)
          .slice(0, 4)
          .map((g) => (
            <span className="pill" key={g}>
              {g}
            </span>
          ))}
      </div>
      <div className="row-cast">{getTopCast(item, lang) || "—"}</div>
      {grade ? <span className="row-grade">★ {grade}</span> : <span className="row-grade empty">{t.unrated}</span>}
      <div className="row-comment">{item.comment || ""}</div>
    </button>
  );
}

function PosterCard({ item, lang, onOpen }: { item: Movie; lang: Lang; onOpen: () => void }) {
  const title = getTitle(item, lang);
  const src = posterUrl(item.posterKey?.[lang] || item.posterKey?.ko);
  const grade = item.grade ? parseFloat(String(item.grade)).toFixed(1) : null;
  return (
    <button className="poster-card" onClick={onOpen}>
      <div className="poster-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src && <img src={src} alt="" loading="lazy" />}
        {grade && <span className="grade-chip">★ {grade}</span>}
      </div>
      <div className="card-title">{title}</div>
      <div className="card-sub">{item.year || ""}</div>
    </button>
  );
}

function MovieModal({
  item,
  lang,
  t,
  onClose,
}: {
  item: Movie;
  lang: Lang;
  t: (typeof I18N)["ko"];
  onClose: () => void;
}) {
  const title = getTitle(item, lang);
  const showSub = item.titleKr && title !== item.titleKr;
  const src = posterUrl(item.posterKey?.[lang] || item.posterKey?.ko, "w342");
  const grade = item.grade ? parseFloat(String(item.grade)).toFixed(1) : "—";
  const vote = item.voteAverage ? parseFloat(String(item.voteAverage)).toFixed(1) : "—";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-poster">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src && <img src={src} alt="" />}
        </div>
        <div className="modal-body">
          <button className="modal-close" aria-label="close" onClick={onClose}>
            &times;
          </button>
          <span className={"modal-cat " + item.category}>{item.category === "movie" ? t.tabMovie : t.tabDrama}</span>
          <h2 className="modal-title">{title}</h2>
          {showSub && <div className="modal-sub">{item.titleKr}</div>}
          <div className="modal-meta">{[item.year, getCountry(item, lang)].filter(Boolean).join(" · ")}</div>
          <div className="rating-row">
            <div className="rating-box mine">
              <div className="label">{t.myRating}</div>
              <div className="value">{grade}</div>
            </div>
            <div className="rating-box">
              <div className="label">TMDB</div>
              <div className="value">{vote}</div>
            </div>
          </div>
          <div className="modal-genres">
            {getGenre(item, lang).map((g) => (
              <span className="pill" key={g}>
                {g}
              </span>
            ))}
          </div>
          <div className="modal-overview">{getOverview(item, lang) || t.noOverview}</div>
          {item.comment && (
            <div className="modal-note">
              <span className="label">{t.myNote}</span>
              <p>{item.comment}</p>
            </div>
          )}
          <div className="modal-cast">
            <span className="label">{t.castLabel}</span>
            <span>{getCasting(item, lang) || t.noInfo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
