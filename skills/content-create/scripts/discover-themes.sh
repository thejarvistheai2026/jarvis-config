#!/bin/bash
# discover-themes.sh — Find recent articles and notes for content themes

VAULT_PATH="/Users/jarvis/Remote Vault"
DAYS_BACK=30

echo "=== Recent Articles (last $DAYS_BACK days) ==="
find "$VAULT_PATH/brain/resources/articles" -name "*.md" -type f -mtime -$DAYS_BACK | while read file; do
    basename "$file" .md
    # Show first 200 chars of content as preview
    head -c 200 "$file" 2>/dev/null | tr '\n' ' ' | sed 's/---.*---//g' | sed 's/^ *//g'
    echo ""
    echo "---"
done

echo ""
echo "=== Recent Daily Notes (last 7 days) ==="
find "$VAULT_PATH/openclaw/daily" -name "*.md" -type f -mtime -7 | sort | while read file; do
    basename "$file"
    grep -E "^(## Ideas|## Tasks|## Decisions)" -A 5 "$file" 2>/dev/null | head -20
    echo "---"
done

echo ""
echo "=== Recent Research Notes ==="
find "$VAULT_PATH/brain/resources/research" -name "*.md" -type f -mtime -$DAYS_BACK 2>/dev/null | head -10 | while read file; do
    basename "$file" .md
    echo "---"
done