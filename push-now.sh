#!/bin/bash

echo "=========================================="
echo "Pushing to GitHub..."
echo "=========================================="
echo ""

cd /home/pts/Projects/GoldApp

# Show commits to be pushed
echo "📦 Commits to push:"
git log origin/main..HEAD --oneline
echo ""

# Try to push
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "View at: https://github.com/DhruvPopat268/GoldApp/commits/main"
else
    echo ""
    echo "❌ Push failed. Please check your credentials."
    echo ""
    echo "To push manually, run:"
    echo "  cd /home/pts/Projects/GoldApp"
    echo "  git push origin main"
fi
