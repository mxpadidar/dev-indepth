// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://mxpadidar.github.io",
  integrations: [sitemap(), icon()],

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
