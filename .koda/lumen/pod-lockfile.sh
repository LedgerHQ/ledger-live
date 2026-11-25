#!/usr/bin/env bash
# Updates the iOS Podfile.lock after the bump, with the same steps as
# .github/workflows/renovate-sync-reusable.yml. React Native's Podfile only reads
# `xcodebuild -version`, so a stub is enough: nothing is compiled.
set -e
mise install ruby@3.3
export PATH="$(mise where ruby@3.3)/bin:$PATH"
cd apps/ledger-live-mobile
bundle install --jobs 4
mkdir -p /tmp/xcode-stub
printf '#!/bin/sh\necho "Xcode 16.4"\necho "Build version 16F6"\n' > /tmp/xcode-stub/xcodebuild
chmod +x /tmp/xcode-stub/xcodebuild
PATH="/tmp/xcode-stub:$PATH" bundle exec ruby scripts/pod-lockfile.rb
