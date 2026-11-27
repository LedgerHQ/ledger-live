#!/usr/bin/env bash
# Regenerates apps/ledger-live-mobile/ios/Podfile.lock on a Linux runner, for the Renovate sync.
set -euo pipefail

# setup-ruby's prebuilt rubies need a writable /opt/hostedtoolcache, which these runners lack.
mise install ruby@3.3
PATH="$(mise where ruby@3.3)/bin:$PATH"

cd apps/ledger-live-mobile
bundle install --jobs 4

# React Native's Podfile only reads `xcodebuild -version`; nothing gets compiled.
fake_bin=$(mktemp -d)
printf '#!/bin/sh\necho "Xcode 16.4"\necho "Build version 16F6"\n' > "$fake_bin/xcodebuild"
chmod +x "$fake_bin/xcodebuild"
PATH="$fake_bin:$PATH" bundle exec ruby scripts/pod-lockfile.rb
