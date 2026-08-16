import { getPosts } from "./posts";

export async function getTopics(limit?: number) {
  const posts = await getPosts();
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const topics = [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));

  return limit === undefined ? topics : topics.slice(0, limit);
}
