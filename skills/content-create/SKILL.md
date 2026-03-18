---
name: content-create
description: Content creation workflow for Franco's blog. Trigger when Franco says "draft time" or requests blog post ideas, article drafts, or content creation. Handles theme discovery from recent articles and daily notes, proposing blog angles, writing drafts using the writing-style-guide.md, and managing the content pipeline from idea to publication.
---

# Content Create

Content creation workflow for Franco's blog — from idea discovery to published draft.

## Trigger

Franco says "draft time" or asks for blog post ideas, article drafts, or content creation help.

## Workflow

### Step 1: Discovery — Find Themes

Search for content themes in:
1. **Recent article captures** (`brain/resources/articles/`) — look at files modified in last 30 days
2. **Daily notes** (`openclaw/daily/YYYY-MM-DD.md`) — check last 7 days
3. **Research notes** (`brain/resources/research/`) — recent insights

Look for:
- Recurring topics or patterns
- Interesting frameworks or mental models
- Problems Franco is thinking about
- Tools/workflows he's exploring

### Step 2: Propose Angles

Present **2–3 blog post angles** to Franco. One sentence each. Format:

```
Here are 3 angles based on your recent captures:

1. **[Angle title]**: [One sentence describing the post]
2. **[Angle title]**: [One sentence describing the post]
3. **[Angle title]**: [One sentence describing the post]

Which one resonates? Or want me to explore a different direction?
```

### Step 3: Write Draft (After Franco Picks)

Once Franco selects an angle:

1. **Read the writing style guide**: `openclaw/writing-style-guide.md`
   - If it doesn't exist, tell Franco: "I need you to create `openclaw/writing-style-guide.md` with your blog voice guidelines."

2. **Write the draft** using the style guide's voice — this is how Franco writes for his blog, NOT how you talk to him.

3. **Save to**: `brain/projects/[kebab-case-title].md`

4. **Frontmatter template**:
```yaml
---
title: "[Post Title]"
status: draft
angle: "[The one-sentence angle Franco picked]"
created: YYYY-MM-DD
themes:
  - [theme 1]
  - [theme 2]
sources:
  - [link to source article/note]
---

# [Post Title]

[Draft content]
```

### Step 4: Approval & Publication

After saving the draft:

1. **Report to Franco**:
   - Summary of what was created
   - Location of the draft
   - Suggested next step (review/edit/publish)

2. **On approval**: Push to blog repo for auto-deployment
   - Blog repo: `git@github.com:thejarvistheai2026/francos-personal-website.git`
   - **CRITICAL: DO NOT auto-push** — most repos are archived. Always confirm with Franco before pushing.
   - Workflow: Create draft → Franco reviews → Confirm push → Commit and push → Auto-deploys

## Key Files

| File | Purpose |
|------|---------|
| `openclaw/writing-style-guide.md` | Blog voice/tone guidelines |
| `brain/projects/` | Working drafts location |
| `brain/resources/articles/` | Captured articles for theme mining |
| `openclaw/daily/` | Daily notes for recent context |
| Blog repo | `git@github.com:thejarvistheai2026/francos-personal-website.git` |

## Scripts

- `scripts/discover-themes.sh` — Find recent articles and notes with themes
- `scripts/create-draft.sh` — Create a new draft file with proper frontmatter

## Notes

- Always use obsidian-cli for vault operations
- The writing-style-guide.md is critical — don't write without it
- Blog repo auto-deploys on push; just need to commit and push