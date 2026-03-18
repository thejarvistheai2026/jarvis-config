#!/usr/bin/env node
/**
 * Add a URL to the content capture queue
 * Usage: node add-to-queue.js <url> [title] [source] [--content "extracted content"]
 */

const fs = require('fs');
const path = require('path');

const QUEUE_PATH = '/Users/jarvis/Remote Vault/openclaw/capture-queue.json';

function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return 'Unknown Source';
  }
}

function sanitizeFilename(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function addToQueue(url, title = null, source = null, extractedContent = null) {
  // Read existing queue
  let queue;
  try {
    const content = fs.readFileSync(QUEUE_PATH, 'utf8');
    queue = JSON.parse(content);
  } catch (err) {
    console.error('Error reading queue file:', err.message);
    process.exit(1);
  }

  // Check if URL already exists
  const existing = queue.items.find(item => item.url === url);
  if (existing) {
    console.log(`⚠️ URL already in queue: ${url}`);
    console.log(`   Queued on: ${existing.queuedAt}`);
    return;
  }

  // Generate title from URL if not provided
  const finalTitle = title || `Article from ${getDomainFromUrl(url)}`;
  const finalSource = source || getDomainFromUrl(url);
  const safeName = sanitizeFilename(finalTitle).slice(0, 50) || 'untitled';

  // Add to queue
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url: url,
    title: finalTitle,
    source: finalSource,
    safeName: safeName,
    status: 'pending',
    queuedAt: new Date().toISOString(),
    extractedContent: extractedContent,
    extractedTitle: null, // Will be set by OpenClaw when extracting
    error: null
  };

  queue.items.push(item);

  // Write back
  try {
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
    console.log(`✅ Added to queue:`);
    console.log(`   Title: ${finalTitle}`);
    console.log(`   Source: ${finalSource}`);
    console.log(`   URL: ${url}`);
    if (extractedContent) {
      console.log(`   Content: ${extractedContent.length} chars extracted`);
    }
    console.log(`   Position: ${queue.items.length}`);
  } catch (err) {
    console.error('Error writing queue file:', err.message);
    process.exit(1);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
let url = null;
let title = null;
let source = null;
let extractedContent = null;

// Simple argument parsing
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--content' && i + 1 < args.length) {
    extractedContent = args[i + 1];
    i++; // Skip next
  } else if (!url) {
    url = args[i];
  } else if (!title) {
    title = args[i];
  } else if (!source) {
    source = args[i];
  }
}

if (!url) {
  console.error('Usage: node add-to-queue.js <url> [title] [source] [--content "extracted content"]');
  process.exit(1);
}

addToQueue(url, title, source, extractedContent);
