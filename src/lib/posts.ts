import { getCollection } from "astro:content";

export const POSTS_PER_PAGE = 6;

export async function getPosts(limit?: number) {
  const posts = await getCollection("blogPosts", ({ data }) => !data.draft);
  const sortedPosts = posts.toSorted(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );

  return limit === undefined ? sortedPosts : sortedPosts.slice(0, limit);
}

export async function getPostPages() {
  const posts = await getPosts();
  const pages = [];

  for (let i = 0; i < posts.length; i += POSTS_PER_PAGE) {
    pages.push(posts.slice(i, i + POSTS_PER_PAGE));
  }

  return pages;
}
