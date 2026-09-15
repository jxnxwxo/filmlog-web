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
  getDirector,
  getTopCast,
  posterUrl,
} from "@/lib/i18n";
import { FlagKR, FlagUS, FlagJP } from "@/components/Flags";
import StarRating from "@/components/StarRating";
import ConfirmDialog from "@/components/ConfirmDialog";

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

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"></line>
      <polyline points="5 12 12 5 19 12"></polyline>
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

export default function HomeClient({ initialItems }: { initialItems: Movie[] }) {
  const [items, setItems] = useState<Movie[]>(initialItems);
  const [category, setCategory] = useState<Category>("movie");
  const [country, setCountry] = useState<CountryFilter>("all");
  const [view, setView] = useState<ViewMode>("text");
  const [sort, setSort] = useState<SortMode>("grade-desc");
  const [lang, setLang] = useState<Lang>("ko");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [selected, setSelected] = useState<Movie | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [showTop, setShowTop] = useState(false);

  const t = I18N[lang];

  function refreshMovies() {
    return fetch("/api/movies")
      .then((r) => r.json())
      .then((data) => setItems(data.items || []));
  }

  function goHome() {
    setCategory("movie");
    setCountry("all");
    setQuery("");
    setSort("grade-desc");
    setView("text");
    window.scrollTo({ top: 0, behavior: "smooth" });
    refreshMovies();
  }

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => setIsAdminView(!!d.isAdmin));
  }, []);

  async function adminLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAdminView(false);
  }

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("filmlog-theme");
    } catch {}
    if (saved === "light") setTheme("light");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
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

  return (
    <>
      <div className="hero">
        <div>
          <h1 onClick={goHome} role="button" tabIndex={0} title={t.siteTitle}>
            {t.siteTitle}
          </h1>
          <p>{t.siteSub}</p>
          <p className="hero-credit">by @jxnxwxo · Powered by TMDB</p>
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
            {isAdminView ? (
              <div style={{ display: "flex", gap: 8 }}>
                <Link href="/admin" className="admin-link">
                  {t.adminPanel}
                </Link>
                <button className="admin-link" onClick={adminLogout} type="button">
                  {t.logout}
                </button>
              </div>
            ) : (
              <Link href="/admin" className="admin-link">
                {t.adminLink}
              </Link>
            )}
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
              onFocus={(e) => e.currentTarget.scrollIntoView({ behavior: "smooth", block: "start" })}
            />
          </div>
          <div className="sort-box">
            <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
              <option value="title">{t.sortTitle}</option>
              <option value="year-desc">{t.sortYearDesc}</option>
              <option value="year-asc">{t.sortYearAsc}</option>
              <option value="grade-desc">{t.sortGradeDesc}</option>
              <option value="tmdb-desc">{t.sortTmdbDesc}</option>
            </select>
            <ChevronIcon />
          </div>
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

        {filtered.length === 0 ? (
          <div className="empty-state">{t.emptyState}</div>
        ) : view === "text" ? (
          <>
            <div className="list-head">
              <div>{t.listHeadTitle}</div>
              <div>{t.listHeadYear}</div>
              <div>{t.listHeadGenre}</div>
              <div>{t.listHeadDirector}</div>
              <div>{t.listHeadCast}</div>
              <div>{sort === "tmdb-desc" ? "TMDB" : t.listHeadGrade}</div>
              <div>{t.myNote}</div>
            </div>
            <div>
              {filtered.map((item) => (
                <ListRow
                  key={item.id}
                  item={item}
                  lang={lang}
                  t={t}
                  showTmdb={sort === "tmdb-desc"}
                  onOpen={() => setSelected(item)}
                />
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

      {showTop && (
        <button
          className="back-to-top"
          aria-label="맨 위로"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUpIcon />
        </button>
      )}

      {selected && (
        <MovieModal
          item={selected}
          lang={lang}
          t={t}
          isAdmin={isAdminView}
          onClose={() => setSelected(null)}
          onChanged={async () => {
            await refreshMovies();
          }}
        />
      )}
    </>
  );
}

function ListRow({
  item,
  lang,
  t,
  showTmdb,
  onOpen,
}: {
  item: Movie;
  lang: Lang;
  t: (typeof I18N)["ko"];
  showTmdb: boolean;
  onOpen: () => void;
}) {
  const title = getTitle(item, lang);
  const metaLine = [item.year, getCountry(item, lang)].filter(Boolean).join(" · ") || "—";
  const gradeRaw = showTmdb ? item.voteAverage : item.grade;
  const grade = gradeRaw != null && gradeRaw !== "" ? parseFloat(String(gradeRaw)).toFixed(1) : null;
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
      <div className="row-director">{getDirector(item, lang) || "—"}</div>
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
  isAdmin,
  onClose,
  onChanged,
}: {
  item: Movie;
  lang: Lang;
  t: (typeof I18N)["ko"];
  isAdmin: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const title = getTitle(item, lang);
  const showSub = item.titleKr && title !== item.titleKr;
  const src = posterUrl(item.posterKey?.[lang] || item.posterKey?.ko, "w185");
  const grade = item.grade ? parseFloat(String(item.grade)).toFixed(1) : "—";
  const vote = item.voteAverage ? parseFloat(String(item.voteAverage)).toFixed(1) : "—";

  const [editGrade, setEditGrade] = useState<number | null>(item.grade == null ? null : Number(item.grade));
  const [editComment, setEditComment] = useState(item.comment || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveEdit() {
    setSaving(true);
    try {
      await fetch("/api/admin/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, grade: editGrade, comment: editComment }),
      });
      await onChanged();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const [confirmDelete, setConfirmDelete] = useState(false);

  async function deleteMovie() {
    setDeleting(true);
    try {
      await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      await onChanged();
      onClose();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

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
        <div className="modal-body">
          <button className="modal-close" aria-label="close" onClick={onClose}>
            &times;
          </button>
          <div className="modal-head">
            <div className="modal-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {src && <img src={src} alt="" />}
            </div>
            <div className="modal-head-info">
              <span className={"modal-cat " + item.category}>{item.category === "movie" ? t.tabMovie : t.tabDrama}</span>
              <h2 className="modal-title">{title}</h2>
              {showSub && <div className="modal-sub">{item.titleKr}</div>}
              <div className="modal-meta">{[item.year, getCountry(item, lang)].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
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
            <span className="label">{t.directorLabel}</span>
            <span>{getDirector(item, lang) || t.noInfo}</span>
          </div>
          <div className="modal-cast">
            <span className="label">{t.castLabel}</span>
            <span>{getCasting(item, lang) || t.noInfo}</span>
          </div>

          {isAdmin && (
            <div className="modal-admin">
              <div className="modal-admin-label">관리자</div>
              <StarRating value={editGrade} onChange={setEditGrade} size={22} />
              <div className="field" style={{ marginTop: 10, marginBottom: 0 }}>
                <input
                  type="text"
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="한줄평…"
                  maxLength={200}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn" type="button" onClick={saveEdit} disabled={saving}>
                  {saving ? "저장 중…" : "저장"}
                </button>
                <button className="btn danger" type="button" onClick={() => setConfirmDelete(true)} disabled={deleting}>
                  {deleting ? "삭제 중…" : "삭제"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog
          message={`"${item.titleKr}"을(를) 삭제하시겠습니까? 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          danger
          onConfirm={deleteMovie}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
