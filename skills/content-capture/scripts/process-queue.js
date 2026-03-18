#!/usr/bin/env node
/**
 * Process the content capture queue and create Obsidian notes
 * Usage: node process-queue.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const QUEUE_PATH = '/Users/jarvis/Remote Vault/openclaw/capture-queue.json';
const VAULT_PATH = '/Users/jarvis/Remote Vault';
const CRM_PATH = path.join(VAULT_PATH, 'crm');
const OUTPUT_PATH = path.join(VAULT_PATH, 'brain/resources/articles');
const DRY_RUN = process.argv.includes('--dry-run');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function log(color, msg) {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function getCrmEntries() {
  const entries = [];
  try {
    const items = fs.readdirSync(CRM_PATH, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory()) {
        // Directory name is the person's/company name
        entries.push({
          name: item.name,
          link: `[[${item.name}]]`,
          path: path.join(CRM_PATH, item.name)
        });
      }
    }
  } catch (err) {
    log('yellow', `Warning: Could not read CRM directory: ${err.message}`);
  }
  return entries;
}

function findWikilinks(text, crmEntries) {
  const links = [];
  const textLower = text.toLowerCase();
  
  for (const entry of crmEntries) {
    // Check if name appears in the text
    const nameParts = entry.name.toLowerCase().split(/[\s-]+/);
    const fullName = entry.name.toLowerCase();
    
    if (textLower.includes(fullName) || 
        (nameParts.length > 1 && nameParts.every(part => textLower.includes(part)))) {
      links.push(entry.link);
    }
  }
  
  return [...new Set(links)]; // Remove duplicates
}

function extractTags(text, title) {
  const tags = [];
  const textLower = text.toLowerCase();
  
  // Common topic patterns
  const topicMap = {
    'startup': ['startup', 'founder', 'vc', 'venture', 'pitch', 'fundraise'],
    'growth': ['growth', 'growth hacking', 'acquisition', 'retention', 'churn'],
    'product': ['product', 'product management', 'product manager', 'pm'],
    'ai': ['ai', 'artificial intelligence', 'llm', 'gpt', 'machine learning', 'ml'],
    'saas': ['saas', 'b2b', 'enterprise', 'software'],
    'community': ['community', 'community building', 'community-led'],
    'marketing': ['marketing', 'go-to-market', 'gtm', 'demand gen'],
    'sales': ['sales', 'bdr', 'sdr', 'closing', 'deal'],
    'founder': ['founder', 'founder story', 'entrepreneur'],
    'leadership': ['leadership', 'management', 'team building', 'culture']
  };
  
  for (const [tag, keywords] of Object.entries(topicMap)) {
    if (keywords.some(k => textLower.includes(k))) {
      tags.push(tag);
    }
  }
  
  // Limit to top 5 tags
  return tags.slice(0, 5);
}

async function fetchAndSummarize(url, preExtractedContent = null) {
  // If content was already extracted, use it
  if (preExtractedContent) {
    log('blue', '   Using pre-extracted content...');
    return {
      title: 'Extracted Content',
      summary: preExtractedContent.slice(0, 500) + (preExtractedContent.length > 500 ? '...' : ''),
      text: preExtractedContent,
      source: new URL(url).hostname.replace(/^www\./, '')
    };
  }
  
  try {
    // Use summarize CLI for extraction
    const result = execSync(`summarize "${url}" --json 2>/dev/null`, {
      encoding: 'utf8',
      timeout: 60000
    });
    
    const data = JSON.parse(result);
    return {
      title: data.title || 'Untitled',
      summary: data.summary || data.text?.slice(0, 500) + '...' || 'No summary available',
      text: data.text || data.summary || '',
      source: data.source || new URL(url).hostname.replace(/^www\./, '')
    };
  } catch (err) {
    log('yellow', `  Summarize failed: ${err.message}`);
    
    // Return minimal info - content extraction should be done beforehand
    return {
      title: 'Unknown Title',
      summary: 'Content extraction failed - please extract content manually before processing',
      text: '',
      source: new URL(url).hostname.replace(/^www\./, '')
    };
  }
}

function sanitizeFilename(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function generateSafeTitle(title, source) {
  const date = new Date().toISOString().split('T')[0];
  const base = sanitizeFilename(title) || sanitizeFilename(source) || 'untitled';
  return `${base}-${date}`;
}

async function processItem(item, crmEntries) {
  log('blue', `\n📄 Processing: ${item.title}`);
  log('blue', `   URL: ${item.url}`);
  
  if (DRY_RUN) {
    log('yellow', '   [DRY RUN - would process]');
    return { status: 'skipped', reason: 'Dry run mode' };
  }
  
  try {
    // Fetch and summarize
    log('blue', '   Fetching content...');
    const content = await fetchAndSummarize(item.url, item.extractedContent);
    
    // Use item's original title if we don't have a better one
    if (content.title === 'Unknown Title' || content.title === 'Extracted Content') {
      content.title = item.title;
    }
    
    // Generate safe filename
    const safeName = item.safeName || generateSafeTitle(content.title, content.source);
    const filename = `${safeName}.md`;
    const filepath = path.join(OUTPUT_PATH, filename);
    
    // Check if file already exists
    if (fs.existsSync(filepath)) {
      log('yellow', `   ⚠️ File already exists: ${filename}`);
      return { status: 'skipped', reason: 'File already exists', filename };
    }
    
    // Find wikilinks
    log('blue', '   Finding connections...');
    const wikilinks = findWikilinks(content.text + ' ' + content.title, crmEntries);
    
    // Extract tags
    const tags = extractTags(content.text + ' ' + content.title, content.title);
    
    // Generate note content
    const today = new Date().toISOString().split('T')[0];
    const noteContent = `---
source: ${content.source}
url: ${item.url}
captured: ${today}
tags: [${tags.join(', ')}]
---

# ${content.title}

## Summary

${content.summary}

## Key Takeaways

- ${content.summary.split('.')[0] || 'Main point from the article'}
- ${content.summary.split('.')[1] || 'Secondary insight'}
- ${content.summary.split('.')[2] || 'Additional consideration'}

## Connections

${wikilinks.length > 0 ? wikilinks.join(' | ') : '*No direct CRM connections found*'}

## Notes

*Captured from [${content.title}](${item.url}) on ${today}*
`;
    
    // Create note using obsidian-cli
    log('blue', '   Creating Obsidian note...');
    const notePath = `brain/resources/articles/${filename.replace('.md', '')}`;
    
    // Escape content for shell
    const escapedContent = noteContent.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    
    execSync(`obsidian-cli create "${notePath}" --content "${escapedContent}"`, {
      encoding: 'utf8',
      cwd: VAULT_PATH
    });
    
    log('green', `   ✅ Created: ${filename}`);
    
    return {
      status: 'success',
      filename,
      title: content.title,
      source: content.source,
      tags,
      wikilinks: wikilinks.length
    };
    
  } catch (err) {
    log('red', `   ❌ Failed: ${err.message}`);
    return { status: 'failed', reason: err.message };
  }
}

async function main() {
  log('blue', '\n📦 Content Capture Queue Processor\n');
  
  // Read queue
  let queue;
  try {
    const content = fs.readFileSync(QUEUE_PATH, 'utf8');
    queue = JSON.parse(content);
  } catch (err) {
    log('red', `Error reading queue: ${err.message}`);
    process.exit(1);
  }
  
  // Filter pending items
  const pending = queue.items.filter(item => item.status === 'pending');
  
  if (pending.length === 0) {
    log('yellow', 'Queue is empty! Nothing to process.\n');
    return;
  }
  
  log('blue', `Found ${pending.length} item(s) to process\n`);
  
  // Get CRM entries for wikilink detection
  const crmEntries = getCrmEntries();
  log('blue', `Loaded ${crmEntries.length} CRM entries\n`);
  
  // Process items
  const results = {
    processed: [],
    skipped: [],
    failed: [],
    noCrm: []
  };
  
  for (const item of pending) {
    const result = await processItem(item, crmEntries);
    
    // Update item status
    item.status = result.status === 'success' ? 'processed' : 
                  result.status === 'skipped' ? 'skipped' : 'failed';
    if (result.reason) item.error = result.reason;
    if (result.filename) item.outputFile = result.filename;
    item.processedAt = new Date().toISOString();
    
    // Categorize results
    if (result.status === 'success') {
      results.processed.push({ ...item, ...result });
      if (result.wikilinks === 0) {
        results.noCrm.push(item.title);
      }
    } else if (result.status === 'skipped') {
      results.skipped.push({ ...item, ...result });
    } else if (result.status === 'failed') {
      results.failed.push({ ...item, ...result });
    }
  }
  
  // Update queue file
  if (!DRY_RUN) {
    queue.lastProcessed = new Date().toISOString();
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  }
  
  // Report results
  log('blue', '\n' + '='.repeat(50));
  log('blue', 'PROCESSING COMPLETE');
  log('blue', '='.repeat(50) + '\n');
  
  // Processed
  log('green', `✅ Processed: ${results.processed.length} item(s)`);
  for (const item of results.processed) {
    console.log(`   • ${item.title} → ${item.filename}`);
    if (item.tags?.length) console.log(`     Tags: ${item.tags.join(', ')}`);
    if (item.wikilinks) console.log(`     Wikilinks: ${item.wikilinks}`);
  }
  
  // Skipped
  if (results.skipped.length) {
    log('yellow', `\n⚠️ Skipped: ${results.skipped.length} item(s)`);
    for (const item of results.skipped) {
      console.log(`   • ${item.title}: ${item.reason}`);
    }
  }
  
  // Failed
  if (results.failed.length) {
    log('red', `\n❌ Failed: ${results.failed.length} item(s)`);
    for (const item of results.failed) {
      console.log(`   • ${item.title}: ${item.reason}`);
    }
  }
  
  // No CRM connections
  if (results.noCrm.length) {
    log('yellow', `\n📝 Items without CRM connections:`);
    for (const title of results.noCrm) {
      console.log(`   • ${title}`);
    }
  }
  
  // Summary
  log('blue', '\n' + '='.repeat(50));
  log('blue', 'SUMMARY');
  log('blue', '='.repeat(50));
  console.log(`Total processed: ${results.processed.length}`);
  console.log(`Skipped: ${results.skipped.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  if (results.processed.length > 0) {
    log('green', '\nNext step: Review the new notes in brain/resources/articles/');
  }
  
  console.log('');
}

main().catch(err => {
  log('red', `Fatal error: ${err.message}`);
  process.exit(1);
});
