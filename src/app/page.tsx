import { getAllMovies } from "@/lib/movies";
import HomeClient from "./HomeClient";

export const revalidate = 300;

export default async function Home() {
  const items = await getAllMovies();
  return <HomeClient initialItems={items} />;
}
