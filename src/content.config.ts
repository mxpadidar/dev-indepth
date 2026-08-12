import { defineCollection } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";

const blogPosts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      tags: z.array(z.string()).default([]),
      author: z.string().default("mxpadidar"),
      draft: z.boolean().default(false),
      heroImage: image(),
      publishedAt: z.coerce.date(),
    }),
});

export const collections = { blogPosts: blogPosts };
