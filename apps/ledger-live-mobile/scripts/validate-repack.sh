#!/bin/bash

# Re.Pack Migration Validation Script
# Run this script to verify the Re.Pack v5 migration is working correctly

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔍 Re.Pack v5 Migration Validation"
echo "==================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check configuration files
echo "📋 Step 1: Checking configuration files..."
echo ""

if grep -q "react-native webpack-start" "$PROJECT_DIR/package.json"; then
    check_pass "package.json has webpack-start command"
else
    check_fail "package.json missing webpack-start command"
fi

if [ -f "$PROJECT_DIR/rspack.config.mjs" ]; then
    check_pass "rspack.config.mjs exists"
else
    check_fail "rspack.config.mjs not found"
fi

if grep -q "@svgr/webpack" "$PROJECT_DIR/rspack.config.mjs"; then
    check_pass "SVG loader configured"
else
    check_warn "SVG loader not found in config"
fi

if grep -q "ReanimatedPlugin()" "$PROJECT_DIR/rspack.config.mjs"; then
    check_pass "ReanimatedPlugin enabled"
else
    check_warn "ReanimatedPlugin not enabled"
fi

if grep -q '".pnpm"' "$PROJECT_DIR/rspack.config.mjs"; then
    check_pass ".pnpm path in module resolution"
else
    check_warn ".pnpm path not in module resolution"
fi

echo ""

# 2. Check dependencies
echo "📦 Step 2: Checking dependencies..."
echo ""

cd "$PROJECT_DIR"

if pnpm list @svgr/webpack --depth=0 2>&1 | grep -q "@svgr/webpack"; then
    check_pass "@svgr/webpack installed"
else
    check_fail "@svgr/webpack not installed. Run: pnpm install"
fi

if pnpm list @callstack/repack --depth=0 2>&1 | grep -q "@callstack/repack"; then
    check_pass "@callstack/repack installed"
else
    check_fail "@callstack/repack not installed"
fi

if pnpm list @rspack/core --depth=0 2>&1 | grep -q "@rspack/core"; then
    check_pass "@rspack/core installed"
else
    check_fail "@rspack/core not installed"
fi

echo ""

# 3. Check React Native CLI integration
echo "🔧 Step 3: Checking React Native CLI integration..."
echo ""

if [ -f "$PROJECT_DIR/react-native.config.js" ]; then
    if grep -q "@callstack/repack/commands" "$PROJECT_DIR/react-native.config.js"; then
        check_pass "Re.Pack commands registered in react-native.config.js"
    else
        check_fail "Re.Pack commands not registered in react-native.config.js"
    fi
else
    check_fail "react-native.config.js not found"
fi

echo ""

# 4. Check babel configuration
echo "🔄 Step 4: Checking Babel configuration..."
echo ""

if [ -f "$PROJECT_DIR/babel.config.js" ]; then
    check_pass "babel.config.js exists"
    
    if grep -q "react-native-reanimated/plugin" "$PROJECT_DIR/babel.config.js"; then
        check_pass "Reanimated Babel plugin present"
    else
        check_warn "Reanimated Babel plugin not found"
    fi
    
    if grep -q "plugin-transform-flow-strip-types" "$PROJECT_DIR/babel.config.js"; then
        check_pass "Flow types stripping enabled"
    else
        check_warn "Flow types stripping not configured"
    fi
else
    check_fail "babel.config.js not found"
fi

echo ""

# 5. Test bundle generation (dry run)
echo "🏗️  Step 5: Testing bundle configuration..."
echo ""

check_warn "Skipping actual bundle generation (would take too long)"
check_warn "To test bundling manually, run:"
echo "   iOS:     pnpm bundle:ios"
echo "   Android: pnpm bundle:android"

echo ""

# 6. Check for common pitfalls
echo "🔍 Step 6: Checking for common issues..."
echo ""

# Check for tls pointing to Node module instead of false
if grep -q 'tls: false' "$PROJECT_DIR/rspack.config.mjs"; then
    check_pass "tls correctly set to false"
elif grep -q 'tls: require.resolve' "$PROJECT_DIR/rspack.config.mjs"; then
    check_fail "tls incorrectly points to Node module (should be false)"
else
    check_warn "tls configuration not found"
fi

# Check for http2 and dns
if grep -q 'http2: false' "$PROJECT_DIR/rspack.config.mjs" && grep -q 'dns: false' "$PROJECT_DIR/rspack.config.mjs"; then
    check_pass "http2 and dns correctly set to false"
else
    check_warn "http2/dns configuration may need review"
fi

# Check for singleton aliases
if grep -q 'react: require.resolve("react")' "$PROJECT_DIR/rspack.config.mjs"; then
    check_pass "React singleton alias configured"
else
    check_warn "React singleton alias not found"
fi

echo ""

# 7. Platform-specific checks
echo "📱 Step 7: Platform-specific configuration..."
echo ""

# Android
if [ -f "$PROJECT_DIR/android/app/build.gradle" ]; then
    check_pass "Android build.gradle exists"
    if grep -q 'apply plugin: "com.facebook.react"' "$PROJECT_DIR/android/app/build.gradle"; then
        check_pass "React plugin applied in Android"
    else
        check_warn "React plugin may not be configured in Android"
    fi
else
    check_warn "Android build.gradle not found"
fi

# iOS
if [ -f "$PROJECT_DIR/ios/ledgerlivemobile.xcodeproj/project.pbxproj" ]; then
    check_pass "iOS project file exists"
    if grep -q "Bundle React Native code and images" "$PROJECT_DIR/ios/ledgerlivemobile.xcodeproj/project.pbxproj"; then
        check_pass "iOS bundle script phase present"
    else
        check_warn "iOS bundle script phase may need verification"
    fi
else
    check_warn "iOS project file not found"
fi

echo ""

# Summary
echo "✅ Validation Complete!"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm start' to start the Re.Pack dev server"
echo "2. In another terminal, run 'pnpm ios' or 'pnpm android'"
echo "3. Verify no duplicate React warnings in logs"
echo "4. Test animations (Reanimated worklets)"
echo "5. Test SVG components"
echo "6. Run E2E tests: 'pnpm e2e:test'"
echo ""
echo "See REPACK_MIGRATION_NOTES.md for detailed validation checklist"

