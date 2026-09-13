import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FILM & DRAMA ARCHIVE",
  description: "시청했던 영화/드라마 기록 · TMDb 데이터로 검증된 컬렉션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inter — DESIGN.md Typography > SF Pro Display/Text > Substitute: "Inter, system-ui" */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Set dark as the default theme before first paint, so a light-OS visitor doesn't flash light. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('filmlog-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
