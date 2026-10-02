# Post Checklist

Apply this checklist to blog posts. Use sections 1–4 while drafting and section 5 when
preparing a post for publication.

## 1. Filename and slug

- [ ] Use a descriptive kebab-case filename, such as `fastapi-vs-django.md` or
      `rest-resources-vs-actions.md`.
- [ ] Avoid generic filenames such as `post-3.md` or `blog-2.md`.
- [ ] Confirm the intended URL: `/posts/{slug}`, where the slug is the filename without `.md`.
- [ ] Choose the slug before publication. If renaming an existing post, check affected links,
      asset references, and any redirect requirements.

## 2. Frontmatter

Use this shape, replacing the placeholders with the post's actual values:

```yaml
---
title: "An opinionated title"
description: >-
  Describe the problem, then explain what the reader will learn.
tags: [clean-code, refactoring]
draft: true
author: mxpadidar
publishedAt: YYYY-MM-DD
heroImage: ../assets/hero-images/{slug}.png
---
```

- [ ] Quote the title and give it a clear point of view rather than a textbook chapter name.
- [ ] Use folded YAML (`>-`) for the description, following the problem → learning arc.
- [ ] Use lowercase tags with hyphens between words; avoid spaces and underscores.
      Each tag generates a `/topics/{tag}` page.
- [ ] Keep new and unfinished posts marked `draft: true`; use `false` when ready.
- [ ] Set `author: mxpadidar`.
- [ ] Set `publishedAt` to a real calendar date in `YYYY-MM-DD` format.
- [ ] Always include `heroImage: ../assets/hero-images/{slug}.png`, even before the image exists.
- [ ] Make the image basename match the post slug exactly.

## 3. Hero image

- [ ] Finish the Markdown before generating the image.
- [ ] Read and follow the repository's `img-prompt.md`.
- [ ] Use a 16:9 composition and the theme palette specified by the image guidance.
- [ ] Make the image specific to the post's argument.
- [ ] Save the actual PNG at the location referenced by `heroImage`.
- [ ] Confirm the file exists before completing publication checks. A missing hero image
      blocks the build under this blog's current rules.

If `img-prompt.md`, image generation, or image-file access is unavailable, report that step
as blocked. Do not invent the theme palette or claim an image has been created.

## 4. Content quality

- [ ] Open with a hook or clear stakes; avoid openings such as “This document explains…”.
- [ ] Use an opinionated voice and include at least one punchy line.
- [ ] Weave in a concrete example: URLs, JSON, requests, or code.
- [ ] Provide a memorable mental-model payoff near the end.
- [ ] Use `text` fences for standalone URL examples, `json` for JSON payloads, and `http`
      for HTTP requests or responses. Use the actual language for other code.
- [ ] Keep prose lines at or below 100 characters. Preserve code-block formatting.

## 5. Publication verification

Run these checks against the version intended for publication. Draft posts may be excluded
from listings, search, and RSS, so those checks require a local version with `draft: false`.

1. Complete sections 1–4, including creation of the hero image.
2. Set `draft: false` locally when the task is to prepare the draft for publication.
3. Run the build and verify the site checks below using the repository's documented preview
   or generated output. Use a browser for interactive behavior such as search and tag clicks.
4. If any required check fails or cannot be run, return the newly prepared post to
   `draft: true`, report the blocker, and do not declare it ready.
5. If all checks pass, leave the prepared post marked `draft: false` and report the results.

- [ ] `npm run build` passes.
- [ ] The post appears on `/posts`, ordered newest first by publication date.
- [ ] The homepage's “Latest posts” includes it when its date puts it within that list's limit.
- [ ] Tag pills link to the correct topic pages, and those pages include the post.
- [ ] Search opened with Ctrl+K finds the post.
- [ ] RSS includes the post.

For a content-only task, publication checks may remain not run and the post stays a draft.
Do not deploy the website unless deployment is part of the user's request.

## Verification report

For a publication review, report each check as **passed**, **failed**, or **not run**.
Give a brief reason for failures and checks not run. Separate verified facts from assumptions.
