"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StarRating from "@/components/StarRating";
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

export default function AdminPage() {
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
          ← 필름로그로 돌아가기
        </Link>
        <h1>관리자</h1>
        <p className="sub">TMDb에서 검색해 새 영화·드라마를 추가합니다.</p>

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
            <button className="btn" type="submit">
              로그인
            </button>
          </form>
        ) : (
          <>
            <button className="btn secondary" onClick={logout} style={{ marginBottom: 20 }}>
              로그아웃
            </button>
            <AddMovieForm />
          </>
        )}
      </div>

      {isAdmin && (
        <div className="admin-card" style={{ marginTop: 24 }}>
          <h1 style={{ fontSize: 20 }}>기존 작품 수정</h1>
          <p className="sub">평점과 한줄평을 고칠 수 있어요.</p>
          <EditMovieSection />
        </div>
      )}
    </div>
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
        const note = data.alreadyLogged
          ? ` (참고: 같은 작품이 이미 있어요 — ${data.alreadyLogged.join(", ")})`
          : "";
        setMessage({ type: "success", text: `"${data.title}" 추가 완료!${note}` });
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
    }
  }

  return (
    <>
      <form onSubmit={search}>
        <div className="field">
          <label>제목으로 검색</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 인터스텔라, Inception…"
          />
        </div>
        <button className="btn" type="submit" disabled={searching}>
          {searching ? "검색 중…" : "TMDb 검색"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="search-results">
          {results.map((r) => (
            <button
              key={`${r.mediaType}-${r.id}`}
              className={"search-result" + (selected?.id === r.id && selected?.mediaType === r.mediaType ? " selected" : "")}
              onClick={() => setSelected(r)}
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
            <div style={{ fontSize: 14, padding: "8px 0" }}>
              {selected.title} ({selected.year})
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
            {submitting ? "추가 중…" : "필름로그에 추가"}
          </button>
        </form>
      )}

      {message && message.type === "success" && selected === null && (
        <div className="msg success">{message.text}</div>
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
        setMessage({ type: "success", text: `"${data.title}" 수정 완료!` });
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
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </button>
            <button className="btn secondary" type="button" onClick={() => setEditing(null)}>
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
