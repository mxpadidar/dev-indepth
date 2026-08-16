import type { APIRoute } from "astro";
import { BASE_PATH } from "../consts";

const getRobotsTxt = (sitemapURL: URL) => `\
User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL(`${BASE_PATH}/sitemap-index.xml`, site);
  return new Response(getRobotsTxt(sitemapURL));
};
