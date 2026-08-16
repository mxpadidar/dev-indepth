import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getPosts } from "../lib/posts";
import { SITE_TITLE, BASE_PATH } from "../consts";

export const GET: APIRoute = async (context) => {
  const posts = await getPosts();

  return rss({
    title: SITE_TITLE,
    description:
      "A digital notebook documenting real-world backend development, system design, Python, and Go.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `${BASE_PATH}/posts/${post.id}`,
    })),
  });
};
