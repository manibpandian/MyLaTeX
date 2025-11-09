#!/bin/bash
set -e

echo "Starting LaTeX Editor Container..."

# Configure git
git config --global user.email "${GIT_EMAIL:-latex@example.com}"
git config --global user.name "${GIT_NAME:-LaTeX Editor}"

# Setup GitHub authentication if token is provided
if [ -n "$GITHUB_TOKEN" ]; then
    git config --global credential.helper store
    echo "https://${GITHUB_TOKEN}@github.com" > ~/.git-credentials
    echo "✓ GitHub authentication configured"
fi

# Start sync daemon in background if enabled
if [ "$ENABLE_SYNC" = "true" ] && [ -n "$GITHUB_REPO" ]; then
    echo "Starting sync daemon..."
    chmod +x /app/sync-daemon.sh
    /app/sync-daemon.sh &
    echo "✓ Sync daemon started (interval: ${SYNC_INTERVAL}s)"
else
    echo "Sync disabled (set ENABLE_SYNC=true to enable)"
fi

echo "Container ready!"

# Execute the main command
exec "$@"