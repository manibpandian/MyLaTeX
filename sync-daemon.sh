#!/bin/bash
SYNC_INTERVAL=${SYNC_INTERVAL:-300}
GITHUB_REPO=${GITHUB_REPO:-""}
GITHUB_BRANCH=${GITHUB_BRANCH:-"latex-docs"}
SHARED_FOLDER="/app/documents"

echo "Sync daemon started. Interval: ${SYNC_INTERVAL}s, Branch: ${GITHUB_BRANCH}"
echo "Sync mode: Documents Folder → GitHub"

initialize_repo() {
    if [ ! -d "/sync-repo/.git" ]; then
        echo "Initializing sync repository..."
        mkdir -p /sync-repo
        cd /sync-repo
        git init -b $GITHUB_BRANCH
        git remote add origin https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git
        git config user.email "${GIT_EMAIL}"
        git config user.name "${GIT_NAME}"
        
        # Try to pull existing branch
        git pull origin $GITHUB_BRANCH 2>/dev/null || echo "Starting fresh branch"
    else
        cd /sync-repo
        # Ensure we're on the correct branch
        CURRENT_BRANCH=$(git branch --show-current)
        if [ "$CURRENT_BRANCH" != "$GITHUB_BRANCH" ]; then
            echo "Switching to branch: $GITHUB_BRANCH"
            git checkout -B $GITHUB_BRANCH
        fi
    fi
}

sync_to_github() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Syncing to GitHub..."
    
    cd /sync-repo
    
    # Pull latest changes first
    git pull origin $GITHUB_BRANCH 2>/dev/null || true
    
    # Clean sync repo (keep .git)
    find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
    
    # Copy from documents folder (excluding cache and git files)
    if [ -d "$SHARED_FOLDER" ] && [ "$(ls -A $SHARED_FOLDER 2>/dev/null)" ]; then
        echo "Copying files from documents folder..."
        rsync -av --exclude='.git' --exclude='.latex_cache' --exclude='*.aux' --exclude='*.log' $SHARED_FOLDER/ /sync-repo/
    else
        echo "Documents folder is empty"
    fi
    
    # Stage all changes
    git add -A
    
    # Check for changes and commit
    if ! git diff --cached --quiet; then
        echo "Changes detected:"
        git status --short
        
        git commit -m "Auto-sync: $(date '+%Y-%m-%d %H:%M:%S')"
        
        echo "Pushing to GitHub..."
        if git push origin $GITHUB_BRANCH 2>&1; then
            echo "✓ Successfully synced to GitHub"
        else
            echo "✗ Push failed, will retry next cycle"
        fi
    else
        echo "No changes to sync"
    fi
}

# Initialize on startup
initialize_repo

# Main sync loop
while true; do
    sync_to_github
    echo "Waiting ${SYNC_INTERVAL} seconds..."
    sleep $SYNC_INTERVAL
done