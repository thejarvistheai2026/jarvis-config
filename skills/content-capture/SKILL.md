---
name: content-capture
description: Capture and process content links for Franco's Obsidian vault. Use when Franco drops a link (URL) in chat, or says "process the queue" or similar. Handles content extraction, summarization, and creation of structured notes in brain/resources/articles/. Also use for "capture this link", "add to reading list", or "queue this article".
---

# Content Capture

Capture links from Franco and transform them into structured Obsidian notes.

## Triggers

- Franco drops a URL/link in chat
- "Process the queue" / "process queue"
- "Capture this link" / "add to reading list" / "queue this article"

## Workflow

### When Franco drops a link:

1. **Extract content** using `web_fetch` tool
2. **Summarize** using `summarize` skill or tool
3. **Add to queue** via `scripts/add-to-queue.js` with extracted data
4. **Confirm** to Franco what was queued

### When Franco says "process the queue":

1. **Process queue** via `scripts/process-queue.js`
2. **Report results:**
   - What was processed
   - What was skipped (and why)
   - What failed
   - Any names without CRM entries
   - Summary + next step

## Queue Location

`/Users/jarvis/Remote Vault/openclaw/capture-queue.json`

## Output Location

`/Users/jarvis/Remote Vault/brain/resources/articles/`

## Scripts

- `scripts/add-to-queue.js <url> [title] [source]` - Add URL to capture queue
- `scripts/process-queue.js` - Process all queued items and create Obsidian notes

## Manual Content Extraction (when needed)

If summarize CLI fails, extract content manually:

```bash
# Option 1: Use summarize CLI
summarize "<url>" --json

# Option 2: Use web_fetch via OpenClaw tool
# Then pass extracted content to add-to-queue.js with --content flag
```

## CRM Wikilink Detection

When processing, scan for mentions of people/companies in the CRM folder (`/Users/jarvis/Remote Vault/crm/`). Create `[[wikilinks]]` for any matches found.

## Note Template

```yaml
---
source: Source Name
url: https://...
captured: 2026-03-18
tags: [topic1, topic2]
---

# Title

## Summary

Brief summary of the content.

## Key Takeaways

- Key point 1
- Key point 2
- Key point 3

## Connections

[[Person Name]] | [[Company Name]]

## Notes

*Captured from [Title](url) on date*
```

## Error Handling

- If extraction fails, queue with error flag for manual review
- If Obsidian note creation fails, report error and keep item in queue
- Always report what succeeded, failed, and was skipped
