import { getCollection } from "astro:content";

export async function getPosts(limit?: number) {
  const posts = await getCollection("blogPosts", ({ data }) => !data.draft);
  const sortedPosts = posts.toSorted(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );

  return limit === undefined ? sortedPosts : sortedPosts.slice(0, limit);
}
