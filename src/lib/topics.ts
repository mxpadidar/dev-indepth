import { getPosts } from "./posts";

export function slugify(topic: string) {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[\s.]+/g, "-");
}

export async function getTopics(limit?: number) {
  const posts = await getPosts();
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const topics = [...counts.entries()]
    .map(([topic, count]) => ({ topic, count, slug: slugify(topic) }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));

  return limit === undefined ? topics : topics.slice(0, limit);
}

export async function getPostsByTopic(topic: string) {
  const posts = await getPosts();
  return posts.filter((post) => post.data.tags.includes(topic));
}
