# Content Capture Skill - Usage Guide

## Quick Reference

### 1. Add a link to the queue

When Franco drops a link, extract content first, then add to queue:

```bash
# Step 1: Extract content (OpenClaw will use web_fetch tool)
# Step 2: Add to queue with extracted content
node "/Users/jarvis/.openclaw/workspace/skills/content-capture/scripts/add-to-queue.js" \
  "URL_HERE" \
  "Article Title" \
  "Source Name" \
  --content "EXTRACTED_CONTENT_HERE"
```

### 2. Process the queue

```bash
node "/Users/jarvis/.openclaw/workspace/skills/content-capture/scripts/process-queue.js"
```

## Workflow

### Franco drops a link:

1. **Jarvis extracts content** using `web_fetch` tool
2. **Jarvis summarizes** using summarize skill or AI summary
3. **Jarvis adds to queue** via the add-to-queue.js script
4. **Jarvis confirms** to Franco what was queued

### Franco says "process the queue":

1. **Jarvis processes** all pending items
2. **Jarvis creates** Obsidian notes in `brain/resources/articles/`
3. **Jarvis reports:**
   - What was processed
   - What was skipped (and why)
   - What failed
   - Any names without CRM entries
   - Summary + next step

## Output Location

Created notes go to: `/Users/jarvis/Remote Vault/brain/resources/articles/`

## Note Format

Each note includes:
- YAML frontmatter (source, URL, captured date, tags)
- Summary
- Key takeaways
- Wikilink connections to CRM entries
- Notes section

## Queue File

`/Users/jarvis/Remote Vault/openclaw/capture-queue.json`

## Scripts

| Script | Purpose |
|--------|---------|
| `add-to-queue.js` | Add URLs to the capture queue |
| `process-queue.js` | Process queue and create Obsidian notes |

## Testing

Test the flow:

```bash
# Reset queue
echo '{"version":"1.0","items":[],"lastProcessed":null}' > "/Users/jarvis/Remote Vault/openclaw/capture-queue.json"

# Add a test item
node skills/content-capture/scripts/add-to-queue.js "https://example.com" "Test" "Test" --content "Test content here"

# Process queue
node skills/content-capture/scripts/process-queue.js
```
