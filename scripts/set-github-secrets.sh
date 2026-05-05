#!/bin/bash
# Set GitHub Secrets for Mine repository

set -e

REPO="oouyang/mine"
KEYSTORE_B64_FILE="$(dirname "$0")/keystore_b64.txt"

echo "🔐 Setting GitHub Secrets for $REPO..."

# Set KEYSTORE_BASE64 from file
echo "Setting KEYSTORE_BASE64..."
gh secret set KEYSTORE_BASE64 --body "$(cat "$KEYSTORE_B64_FILE")" --repo "$REPO"

# Set KEYSTORE_PASSWORD
echo "Setting KEYSTORE_PASSWORD..."
echo "octP@ssw0rd" | gh secret set KEYSTORE_PASSWORD --repo "$REPO"

# Set KEY_ALIAS
echo "Setting KEY_ALIAS..."
echo "mine" | gh secret set KEY_ALIAS --repo "$REPO"

# Set KEY_PASSWORD
echo "Setting KEY_PASSWORD..."
echo "octP@ssw0rd" | gh secret set KEY_PASSWORD --repo "$REPO"

echo "✅ All secrets set successfully for $REPO"
