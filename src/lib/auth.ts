import { cookies } from "next/headers";

const COOKIE_NAME = "filmlog_admin";

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return !!token && token === process.env.SESSION_SECRET;
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, process.env.SESSION_SECRET || "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
