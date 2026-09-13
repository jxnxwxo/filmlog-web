import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "필름로그",
  description: "개인 관람 기록부 · TMDb 데이터로 검증된 영화·드라마 컬렉션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Inter — DESIGN.md Typography > SF Pro Display/Text > Substitute: "Inter, system-ui" */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
