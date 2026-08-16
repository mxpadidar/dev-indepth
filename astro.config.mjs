// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
  site: "https://mxpadidar.github.io",
  base: "/dev-indepth",
  integrations: [
    sitemap(),
    icon(),
    expressiveCode({
      themes: ["tokyo-night"],
      defaultProps: {
        showLineNumbers: true,
      },
    }),
  ],

  fonts: [
    {
      name: "SUSE Mono",
      cssVariable: "--font-suse-mono",
      provider: fontProviders.fontsource(),
      styles: ["normal"],
      weights: ["300 700"],
    },
  ],
});
