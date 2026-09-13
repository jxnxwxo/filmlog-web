"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    </div>
  );
}

function AddMovieForm() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchCandidate[]>([]);
  const [selected, setSelected] = useState<SearchCandidate | null>(null);
  const [grade, setGrade] = useState("");
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
          grade: grade === "" ? null : Number(grade),
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
        setGrade("");
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
            <label>내 평점 (0~5, 0.5 단위, 비워두면 미평가)</label>
            <input
              type="number"
              min={0}
              max={5}
              step={0.5}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
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
