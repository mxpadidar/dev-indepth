// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://mxpadidar.github.io",
  integrations: [sitemap()],

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
