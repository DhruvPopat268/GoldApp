#!/bin/bash

# Git Push Helper Script
# This script helps you push changes to GitHub

echo "=========================================="
echo "Git Push Helper - GoldApp"
echo "=========================================="
echo ""

cd /home/pts/Projects/GoldApp

# Check if there are commits to push
COMMITS_TO_PUSH=$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l)

if [ "$COMMITS_TO_PUSH" -eq 0 ]; then
    echo "✓ No new commits to push. Everything is up to date!"
    exit 0
fi

echo "📦 Commits ready to push: $COMMITS_TO_PUSH"
echo ""
git log origin/main..HEAD --oneline
echo ""

echo "=========================================="
echo "Choose authentication method:"
echo "=========================================="
echo "1. Personal Access Token (Recommended)"
echo "2. SSH Key"
echo "3. GitHub CLI"
echo "4. Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📝 Using Personal Access Token"
        echo ""
        echo "Steps:"
        echo "1. Go to: https://github.com/settings/tokens"
        echo "2. Click 'Generate new token (classic)'"
        echo "3. Select scope: 'repo'"
        echo "4. Copy the token"
        echo ""
        read -p "Enter your GitHub username: " username
        read -sp "Enter your Personal Access Token: " token
        echo ""
        echo ""
        echo "🚀 Pushing to GitHub..."
        git push https://$username:$token@github.com/DhruvPopat268/GoldApp.git main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Successfully pushed to GitHub!"
            echo "View at: https://github.com/DhruvPopat268/GoldApp/commits/main"
        else
            echo ""
            echo "❌ Push failed. Please check your credentials."
        fi
        ;;
    
    2)
        echo ""
        echo "🔑 Using SSH Key"
        echo ""
        
        if [ ! -f ~/.ssh/id_ed25519.pub ] && [ ! -f ~/.ssh/id_rsa.pub ]; then
            echo "No SSH key found. Generating one..."
            read -p "Enter your email: " email
            ssh-keygen -t ed25519 -C "$email"
            echo ""
            echo "📋 Copy this SSH key and add it to GitHub:"
            echo "   https://github.com/settings/keys"
            echo ""
            cat ~/.ssh/id_ed25519.pub
            echo ""
            read -p "Press Enter after adding the key to GitHub..."
        fi
        
        echo "🚀 Pushing to GitHub..."
        git remote set-url origin git@github.com:DhruvPopat268/GoldApp.git
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Successfully pushed to GitHub!"
            echo "View at: https://github.com/DhruvPopat268/GoldApp/commits/main"
        else
            echo ""
            echo "❌ Push failed. Make sure your SSH key is added to GitHub."
        fi
        ;;
    
    3)
        echo ""
        echo "🔧 Using GitHub CLI"
        echo ""
        
        if ! command -v gh &> /dev/null; then
            echo "GitHub CLI is not installed."
            echo "Install it from: https://cli.github.com/"
            exit 1
        fi
        
        echo "Logging in to GitHub..."
        gh auth login
        
        echo ""
        echo "🚀 Pushing to GitHub..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Successfully pushed to GitHub!"
            echo "View at: https://github.com/DhruvPopat268/GoldApp/commits/main"
        else
            echo ""
            echo "❌ Push failed."
        fi
        ;;
    
    4)
        echo "Exiting..."
        exit 0
        ;;
    
    *)
        echo "Invalid choice. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Push Complete!"
echo "=========================================="
