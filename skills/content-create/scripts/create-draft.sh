#!/bin/bash
# create-draft.sh — Create a new draft with proper frontmatter

VAULT_PATH="/Users/jarvis/Remote Vault"
PROJECTS_DIR="$VAULT_PATH/brain/projects"

# Usage: create-draft.sh "Post Title" "angle description" "theme1,theme2"
TITLE="$1"
ANGLE="$2"
THEMES="$3"
DATE=$(date +%Y-%m-%d)

# Convert title to kebab-case for filename
FILENAME=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//').md

# Create frontmatter
cat > "$PROJECTS_DIR/$FILENAME" << EOF
---
title: "$TITLE"
status: draft
angle: "$ANGLE"
created: $DATE
themes:
EOF

# Add themes as yaml list
IFS=',' read -ra THEME_ARRAY <<< "$THEMES"
for theme in "${THEME_ARRAY[@]}"; do
    echo "  - $(echo $theme | sed 's/^ *//')" >> "$PROJECTS_DIR/$FILENAME"
done

cat >> "$PROJECTS_DIR/$FILENAME" << EOF
sources:
  - 
---

# $TITLE

EOF

echo "Draft created: brain/projects/$FILENAME"