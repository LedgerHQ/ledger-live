#!/bin/bash
# Build wallet agent - Executes build commands sequentially

set -e  # Exit on error

echo "🚀 Starting Build wallet agent..."
echo ""

echo "📦 Step 1/5: Installing dependencies..."
pnpm i

echo ""
echo "🔨 Step 2/5: Building ledger-live-desktop..."
pnpm build:lld

echo ""
echo "📚 Step 3/5: Building ledger-live-desktop dependencies..."
pnpm build:lld:deps

echo ""
echo "⚙️  Step 4/5: Building CLI..."
pnpm build:cli

echo ""
echo "🧪 Step 5/5: Building desktop testing version..."
pnpm desktop build:testing

echo ""
echo "✅ Build wallet agent completed successfully!"

