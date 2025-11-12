#!/bin/bash

GITHUB_TOKEN="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"
REPO_NAME="ai-twitter-monitor"

echo "Creating GitHub repository..."

response=$(curl -s -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"AI Twitter Monitor - Track trending AI-related posts from Twitter/X\",\"private\":false,\"auto_init\":false}")

echo "$response" | jq .

# Extract clone URL
clone_url=$(echo "$response" | jq -r '.clone_url')

if [ "$clone_url" != "null" ]; then
  echo "Repository created successfully!"
  echo "Clone URL: $clone_url"
else
  echo "Error creating repository. Response:"
  echo "$response"
fi
