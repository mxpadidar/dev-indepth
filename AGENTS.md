# Blog repository instructions

## Working on posts

Apply these rules when creating, editing, reviewing, or preparing blog posts for publication.
They do not apply to every Markdown document or unrelated website changes.

- Read relevant existing posts in `src/content/`, prioritizing published posts, and read
  `src/content.config.ts` before choosing a post location or tags.
- Use the user's request and existing content as input. Ask a focused question only when missing
  information would substantially change the argument or scope.
- Fix issues within the requested scope. Preserve the post's argument and the author's voice.
  A review does not authorize rewriting the post.
- Write new posts to `src/content/{slug}.md`. Edit files directly when changes are requested and
  summarize the result instead of returning the entire post in a code fence.
- Keep new and unfinished posts marked `draft: true`. Editing an already published post does
  not automatically require changing its draft status.
- Apply the writing and formatting requirements during drafting. Run publication verification
  only when preparing a post for publication or when explicitly requested.
- Generate images separately after the Markdown is complete, when image creation is requested.
- Keep `post-prompt.md` as a self-contained prompt for online AI without project access. When
  changing shared writing or formatting requirements, keep both documents consistent without
  replacing the standalone prompt's instructions with references to project files.

## Writing goal

Help a developer understand one idea well enough to reason about it in their own code. Choose a
specific confusion, decision, or connection worth explaining. A familiar topic can make a useful
post through a clear explanation; it does not need a novel theory or a provocative opinion.

Assume readers know basic programming but may be new to the concept. Keep the reasoning needed
to understand the idea and its limits. Cut repetition and background before cutting explanation.
Use no fixed word target. Existing posts are voice references, not structural templates.

## Before drafting

Privately establish three things before writing the title or outline:

- Reader question: what specific confusion or decision will this post help resolve?
- Main insight: what will the reader understand beyond being able to repeat a definition?
- Demonstration: what example, comparison, or explanation will make that insight understandable?

If the answers merely promise to define a topic and list its benefits, sharpen the angle first.
Use the supplied material to find a useful distinction or difficult point. Do not manufacture
controversy or ask the user to choose among angles when the context supports a clear choice.

## Title, description, and opening

- Give the title a clear angle: a recognizable problem, a useful claim, or a connection the post
  can explain. Name enough of the subject for readers to know whether it concerns them.
- Make the description add a reason to read: the specific confusion or consequence and the
  understanding the post offers. Avoid merely repeating the title.
- Start with the observation, friction, or question that makes this particular topic worth
  explaining. Make its relevance clear without requiring prior knowledge of the terminology.
- A scenario should expose something the explanation must resolve. Start at that point; avoid
  routine setup such as "Imagine you are building an application" when it adds no useful detail.
- Read the whole argument before finalizing the opening. A useful observation buried in the
  middle may be the best place to begin. Let the subject determine the opening's form.
- Give readers enough context to follow. Introduce a definition early when it helps; otherwise
  introduce the term when the reader has something concrete to connect it to. Do not withhold
  a simple answer to manufacture suspense.
- Avoid exaggerated promises, manufactured controversy, rhetorical teasers, and announcements
  such as "In this article, we'll explore." The body must deliver what the opening promises.

## Content and length

- Build the post around the reader question. Let each section resolve part of it or develop the
  explanation. Do not default to a definition, benefits, example, and conclusion outline.
- Explain the mechanism: what causes the outcome, which decision changes it, and why. A label
  such as "high cohesion" or "more maintainable" cannot replace that reasoning.
- Keep definitions brief and accurate, and connect them to the example. The reader should be
  able to explain the idea in their own words and reason about another case after reading.
- Prefer one small example that develops with the explanation. Choose it for what it reveals.
  A generic scenario that merely assigns business names to a definition adds little.
- Make the reasoning visible. Show a relevant decision and its consequences, or compare the
  same situation before and after a change. Where useful, explain why a plausible alternative
  falls short. Do not force a failed attempt or a before-and-after structure into every post.
- Use concrete names, code, inputs, outputs, or failure scenarios. Explain what changes and why.
  Prefer Python for general programming examples unless another language better fits the topic.
- Keep code focused. Include necessary context and imports. Identify omitted behavior when its
  absence could mislead; avoid boilerplate caveats for every simplified snippet.
- Use an analogy only while it explains the mechanism. Connect it back to the actual concept
  and explain its limits when they matter.
- Include a limit or alternative when it changes the reader's decision or prevents a likely
  misunderstanding. Keep background history, quotations, and side topics only when they help
  resolve the reader question. Add a second example only when the first cannot teach the point.
- Keep each paragraph useful: it should explain, demonstrate, qualify, or advance the argument.
  Preserve the steps that connect an example to the conclusion; remove repeated takeaways.
- End when the reader can use the insight. A concrete decision rule or next action can help,
  but do not force a recap, inspirational line, or memorable slogan.

## Voice and accuracy

- Write like a developer explaining a problem to a colleague: plain words, active verbs, direct
  opinions, and enough detail to support them. Explain necessary jargon when it first appears.
- Preserve my supplied opinions, humor, and personal phrasing. Use natural paragraph lengths
  and sentence rhythms without turning every point into a dramatic one-line statement.
- Avoid stock phrases, inflated adjectives, repeated rhetorical questions, excessive bold text,
  decorative em dashes, and formulas such as "This isn't X. It's Y."
- Show the consequence instead of announcing that something is important or revolutionary.
  Prefer "this change requires editing three callers" to "this improves maintainability."
- Do not invent personal experience, production incidents, quotations, statistics, or benchmarks.
  Hypothetical examples are welcome; introduce them as examples rather than events from my life.
- Verify uncertain or version-dependent technical claims using primary sources. Link sources
  where attribution helps, and distinguish measured results from expectations or assumptions.
  If source access is unavailable, flag unresolved claims outside the draft instead of inventing
  citations or claiming verification.
- State the conditions behind an opinion. Avoid turning a useful guideline into an absolute rule.
- Judge naturalness by the writing itself: specificity, coherent reasoning, and recognizable voice.
  Do not use AI-detector scores or add deliberate mistakes to make the writing seem human.

## Filename and slug

- [ ] Use a descriptive kebab-case filename, such as `fastapi-vs-django.md` or
      `rest-resources-vs-actions.md`.
- [ ] Avoid generic filenames such as `post-3.md` or `blog-2.md`.
- [ ] Confirm the intended URL: `/posts/{slug}`, where the slug is the filename without `.md`.
- [ ] Choose the slug before publication. If renaming an existing post, check affected links,
      asset references, and any redirect requirements.

## Frontmatter

Use this shape, replacing the placeholders with the post's actual values:

```yaml
---
title: "An opinionated title"
description: >-
  Describe the problem, then explain what the reader will learn.
tags: [clean-code, refactoring]
relatedPosts: []
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
- [ ] Optionally list existing post IDs under `relatedPosts`, without paths or `.md` extensions.
      For example, `relatedPosts: [python-asyncio-guide]`. Omit it or use `[]` for no
      recommendations. The site renders published targets in the given order, using their titles
      and descriptions. Use this field for closing recommendations; contextual links within the
      explanation can stay in the body.

## Hero image

- [ ] Finish the Markdown before generating the image.
- [ ] Read and follow the repository's `IMAGE-PROMPT.md`.
- [ ] Use a 16:9 composition and the theme palette specified by the image guidance.
- [ ] Make the image specific to the post's argument.
- [ ] Save the actual PNG at the location referenced by `heroImage`.
- [ ] Confirm the file exists before completing publication checks. A missing hero image
      blocks the build under this blog's current rules.

If `IMAGE-PROMPT.md`, image generation, or image-file access is unavailable, report that step
as blocked. Do not invent the theme palette or claim an image has been created.

## Markdown formatting

- Put the title in frontmatter; begin the body with the opening paragraph rather than another H1.
- Use descriptive H2 headings for sections and H3 headings only when a section needs subdivisions.
- Keep prose source lines at or below 100 characters. Wrap paragraphs with single newlines;
  separate paragraphs with blank lines. Preserve code indentation and meaningful formatting.
- Label code fences with the actual language, such as `python` or `sql`. Use `text` for standalone
  URLs and plain-text diagrams, `json` for JSON, and `http` for HTTP requests or responses.
- Use lists for steps or genuinely parallel items, tables for useful comparisons, and prose for
  explanations. Use bold sparingly. Leave a blank line before lists and after headings.
- Include at least one concrete example that helps explain the main insight. Use headings and
  formatting to support the reasoning; do not add a slogan to satisfy a style requirement.

## Final writing checklist

Before returning the draft, check:

- Angle: can you state the specific reader question and the insight the post offers?
- Opening: does it expose that question or insight with enough context to care? If changing only
  the topic names would make it fit an unrelated post, make it more specific.
- Understanding: can the reader explain why the example behaves as shown and use the reasoning
  in another case? Naming the concept or quoting its definition is insufficient.
- Progression: does each section develop the explanation? Move an insight earlier when it makes
  the argument easier to follow. Remove sections that merely satisfy a familiar blog outline.
- Judgment: can the reader recognize when the idea helps and when its main limitation matters?
- Brevity: can a paragraph disappear without losing reasoning or necessary context? Cut it.
- Evidence: does each major claim have a mechanism, example, or appropriate source behind it?
- Voice: does it sound natural read aloud, with concrete language and no repeated writing formulas?
- Format: are frontmatter values complete, code fences labeled, and prose lines at most
  100 characters? Does the filename match the chosen slug?

Fix issues found during this review before returning the draft. If the angle or explanation
fails, revise that reasoning before polishing individual sentences.

## Publication verification

Run these checks against the version intended for publication. Draft posts may be excluded
from listings, search, and RSS, so those checks require a local version with `draft: false`.

1. Complete the writing, formatting, and asset checks above, including the hero image.
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

For content-only work on a new or unfinished post, publication checks may remain not run and
the post stays a draft. Preserve an already published post's status during ordinary edits.
Do not deploy the website unless deployment is part of the user's request.

## Verification report

For a publication review, report each check as **passed**, **failed**, or **not run**.
Give a brief reason for failures and checks not run. Separate verified facts from assumptions.
