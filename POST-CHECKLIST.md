# Post Checklist

Run through this for every markdown file before moving it out of draft.

## 1. Filename = slug

- [ ] Kebab-case and descriptive (`fastapi-vs-django`, `rest-resources-vs-actions`)
- [ ] Never generic (`post-3.md`, `blog-2.md`)
- [ ] Filename becomes the URL (`/posts/{filename}`) — rename now if unsure

## 2. Frontmatter

```yaml
---
title: "…"
description: >-
  …
tags: [a, b, c]
draft: false
author: mxpadidar
publishedAt: YYYY-MM-DD
heroImage: ../assets/hero-images/{slug}.png
---
```

- [ ] `title` quoted, opinionated — a POV, not a textbook chapter title
- [ ] `description` folded with `>-`, follows the "here's the problem → here's what you'll learn" arc
- [ ] `tags` lowercase + hyphenated only (each tag auto-generates a `/topics/{tag}` page)
- [ ] `draft: true` while in progress; `false` only when ready
- [ ] `publishedAt` set to a valid ISO date
- [ ] `heroImage` path matches the slug

## 3. Hero image

- [ ] `heroImage` frontmatter always present, pointing to `../assets/hero-images/{slug}.png` — add it even before the image exists
- [ ] Image file created after the markdown is complete, generated via `img-prompt.md` (16:9, theme palette, specific to the post's argument)
- [ ] Build fails until the image file exists — create it before moving the post out of draft

## 4. Content quality bar

- [ ] Opens with a hook or stakes — never "This document explains…"
- [ ] Opinionated voice, at least one punchy line
- [ ] A concrete example woven in (URLs, JSON, code) — not abstract theory
- [ ] A memorable mental-model payoff near the end
- [ ] Code fences: `` ```text `` for URLs, `` ```json `` / `` ```http `` for payloads and requests
- [ ] Line length max 100 characters (prose only — code blocks keep their formatting)

## 5. Final verification

- [ ] `npm run build` passes
- [ ] Post listed on `/posts` (newest first) and homepage "Latest posts"
- [ ] Tag pills work — topic pages show the post
- [ ] Search (Ctrl+K) finds it
- [ ] RSS includes it
