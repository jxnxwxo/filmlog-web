"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Movie, getTitle } from "@/lib/i18n";

interface SearchCandidate {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  originalTitle: string;
  year: string;
  posterPath: string | null;
  popularity: number;
  overview: string;
}

interface ExistingMatch {
  id: number;
  titleKr: string;
  grade: number | string | null;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => setIsAdmin(!!d.isAdmin))
      .finally(() => setChecking(false));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setIsAdmin(true);
      router.push("/");
    } else {
      setLoginError("비밀번호가 올바르지 않습니다.");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAdmin(false);
  }

  if (checking) return null;

  return (
    <div className="admin-wrap">
      <div className="admin-card">
        <Link href="/" className="admin-link" style={{ marginBottom: 20, display: "inline-block" }}>
          ← 뒤로
        </Link>
        <h1>관리자</h1>
        <p className="sub">새 작품을 추가하거나, 평점·한줄평을 수정합니다.</p>

        {!isAdmin ? (
          <form onSubmit={login}>
            {loginError && <div className="msg error">{loginError}</div>}
            <div className="field">
              <label>비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn small" type="submit">
              로그인
            </button>
          </form>
        ) : (
          <>
            <button className="btn secondary small" onClick={logout} style={{ marginBottom: 20 }}>
              로그아웃
            </button>
            <AdminTabs />
          </>
        )}
      </div>
    </div>
  );
}

function AdminTabs() {
  const [tab, setTab] = useState<"add" | "edit">("add");
  return (
    <>
      <div className="segmented" style={{ width: "100%", marginBottom: 20 }}>
        <button className={tab === "add" ? "active" : ""} onClick={() => setTab("add")} type="button">
          새 작품 추가
        </button>
        <button className={tab === "edit" ? "active" : ""} onClick={() => setTab("edit")} type="button">
          기존 작품 수정
        </button>
      </div>
      {tab === "add" ? <AddMovieForm /> : <EditMovieSection />}
    </>
  );
}

function AddMovieForm() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchCandidate[]>([]);
  const [selected, setSelected] = useState<SearchCandidate | null>(null);
  const [grade, setGrade] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState<"movie" | "drama">("movie");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [existingMatch, setExistingMatch] = useState<ExistingMatch | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setMessage(null);
    setSelected(null);
    try {
      const res = await fetch("/api/admin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } finally {
      setSearching(false);
    }
  }

  function selectCandidate(r: SearchCandidate) {
    setSelected(r);
    setGrade(null);
    setComment("");
    setMessage(null);
  }

  function unselect() {
    setSelected(null);
    setMessage(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const checkRes = await fetch(
        `/api/admin/check?tmdbId=${selected.id}&mediaType=${selected.mediaType}`
      );
      const checkData = await checkRes.json();
      if (checkData.exists && checkData.movie) {
        setExistingMatch(checkData.movie);
        setSubmitting(false);
        return;
      }
      await doAdd();
    } finally {
      setSubmitting(false);
    }
  }

  async function doAdd() {
    if (!selected) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: selected.id,
          mediaType: selected.mediaType,
          grade,
          comment,
          category,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `"${data.title}" 추가 완료! (평점 ${grade ?? "미평가"})` });
        setSelected(null);
        setResults([]);
        setQuery("");
        setGrade(null);
        setComment("");
      } else {
        setMessage({ type: "error", text: data.error || "추가에 실패했습니다." });
      }
    } finally {
      setSubmitting(false);
      setExistingMatch(null);
    }
  }

  async function doUpdateExisting() {
    if (!existingMatch) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: existingMatch.id, grade, comment }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `"${data.title}" 업데이트 완료! (평점 ${grade ?? "미평가"})` });
        setSelected(null);
        setResults([]);
        setQuery("");
        setGrade(null);
        setComment("");
      } else {
        setMessage({ type: "error", text: data.error || "업데이트에 실패했습니다." });
      }
    } finally {
      setSubmitting(false);
      setExistingMatch(null);
    }
  }

  return (
    <>
      <form onSubmit={search}>
        <div className="field">
          <label>제목으로 검색</label>
          <div className="input-with-button">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="예: 인터스텔라, Inception…"
            />
            <button type="submit" aria-label="검색" disabled={searching}>
              <SearchIcon />
            </button>
          </div>
        </div>
      </form>

      {!selected && results.length > 0 && (
        <div className="search-results">
          {results.map((r) => (
            <button
              key={`${r.mediaType}-${r.id}`}
              className="search-result"
              onClick={() => selectCandidate(r)}
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {r.posterPath ? (
                <img src={`https://image.tmdb.org/t/p/w92${r.posterPath}`} alt="" />
              ) : (
                <div style={{ width: 40, height: 60, background: "var(--surface-2)", borderRadius: 4 }} />
              )}
              <div className="info">
                <div className="t">{r.title}</div>
                <div className="y">
                  {r.year} · {r.mediaType === "movie" ? "영화" : "TV"} · {r.originalTitle}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <form onSubmit={submit}>
          {message && <div className={"msg " + message.type}>{message.text}</div>}
          <div className="field">
            <label>선택한 작품</label>
            <div className="search-result selected" style={{ cursor: "default" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {selected.posterPath ? (
                <img src={`https://image.tmdb.org/t/p/w92${selected.posterPath}`} alt="" />
              ) : (
                <div style={{ width: 40, height: 60, background: "var(--surface-2)", borderRadius: 4 }} />
              )}
              <div className="info">
                <div className="t">{selected.title}</div>
                <div className="y">
                  {selected.year} · {selected.mediaType === "movie" ? "영화" : "TV"}
                </div>
              </div>
              <button type="button" className="unselect-btn" onClick={unselect} aria-label="선택 취소">
                ✕
              </button>
            </div>
          </div>
          <div className="field">
            <label>분류</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as "movie" | "drama")}>
              <option value="movie">영화</option>
              <option value="drama">드라마</option>
            </select>
          </div>
          <div className="field">
            <label>내 평점</label>
            <StarRating value={grade} onChange={setGrade} />
          </div>
          <div className="field">
            <label>한줄평 (선택)</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="이 작품에 대한 한줄평…"
              maxLength={200}
            />
          </div>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "추가 중…" : "추가"}
          </button>
        </form>
      )}

      {message && message.type === "success" && selected === null && (
        <div className="msg success">{message.text}</div>
      )}

      {existingMatch && (
        <ConfirmDialog
          message={`${existingMatch.titleKr} (평점 ${
            existingMatch.grade != null ? Number(existingMatch.grade).toFixed(1) : "미평가"
          })\n이미 존재하는 작품입니다. 새로 업데이트할까요?`}
          confirmLabel="업데이트"
          onConfirm={doUpdateExisting}
          onCancel={() => setExistingMatch(null)}
        />
      )}
    </>
  );
}

function EditMovieSection() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Movie | null>(null);
  const [grade, setGrade] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function loadMovies() {
    setLoading(true);
    fetch("/api/movies")
      .then((r) => r.json())
      .then((d) => setMovies(d.items || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadMovies();
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? movies.filter((m) => [m.titleKr, m.titleEn, m.titleJa].join(" ").toLowerCase().includes(q))
    : [];

  function startEdit(m: Movie) {
    setEditing(m);
    setGrade(m.grade == null ? null : Number(m.grade));
    setComment(m.comment || "");
    setMessage(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, grade, comment }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `"${data.title}" 수정 완료! (평점 ${grade ?? "미평가"})` });
        setEditing(null);
        setQuery("");
        loadMovies();
      } else {
        setMessage({ type: "error", text: data.error || "수정에 실패했습니다." });
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="sub">불러오는 중…</p>;

  return (
    <>
      {!editing ? (
        <>
          <div className="field">
            <label>제목으로 찾기</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="수정할 작품 제목…"
            />
          </div>
          {filtered.length > 0 && (
            <div className="search-results">
              {filtered.slice(0, 15).map((m) => (
                <button key={m.id} type="button" className="search-result" onClick={() => startEdit(m)}>
                  <div className="info">
                    <div className="t">{getTitle(m, "ko")}</div>
                    <div className="y">
                      {m.year} · {m.grade != null ? `★ ${Number(m.grade).toFixed(1)}` : "미평가"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <form onSubmit={save}>
          {message && <div className={"msg " + message.type}>{message.text}</div>}
          <div className="field">
            <label>수정 중인 작품</label>
            <div style={{ fontSize: 14, padding: "8px 0" }}>
              {getTitle(editing, "ko")} ({editing.year})
            </div>
          </div>
          <div className="field">
            <label>내 평점</label>
            <StarRating value={grade} onChange={setGrade} />
          </div>
          <div className="field">
            <label>한줄평</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="이 작품에 대한 한줄평…"
              maxLength={200}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn small" type="submit" disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </button>
            <button className="btn secondary small" type="button" onClick={() => setEditing(null)}>
              취소
            </button>
          </div>
        </form>
      )}

      {message && message.type === "success" && !editing && (
        <div className="msg success">{message.text}</div>
      )}
    </>
  );
}
