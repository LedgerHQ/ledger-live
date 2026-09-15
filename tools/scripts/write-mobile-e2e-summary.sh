#!/usr/bin/env bash
# Write the run's resolved configuration to the job summary, so a dispatch records what
# it actually ran rather than what was requested.
#
# Env: GITHUB_STEP_SUMMARY, WORKFLOW_REF, TRIGGERED_BRANCH, COMMIT_SHA, IOS_DEVICE,
#      ANDROID_DEVICE, FILTER_PATTERN, SMOKE_TESTS, BUILD_TYPE, IOS_BROADCAST_ENABLED,
#      ANDROID_BROADCAST_ENABLED, SLACK_NOTIF_STATUS, ANDROID_FEATURE_FLAGS,
#      IOS_FEATURE_FLAGS, E2E_FEATURE_FLAGS_JSON

set -euo pipefail

: "${GITHUB_STEP_SUMMARY:?GITHUB_STEP_SUMMARY must be set}"

FILTER_PATTERN="${FILTER_PATTERN:-}"
EXTRA_FEATURE_FLAGS="${E2E_FEATURE_FLAGS_JSON:-}"
[ -n "$FILTER_PATTERN" ] || FILTER_PATTERN="(none)"
[ -n "$EXTRA_FEATURE_FLAGS" ] || EXTRA_FEATURE_FLAGS="(none)"

FILTER_SUMMARY="$(node e2e/tooling/filter/format-summary.mjs "$FILTER_PATTERN")"

{
  echo "## Workflow Context"
  echo ""
  echo "- **Workflow source branch:** ${WORKFLOW_REF:-}"
  echo "- **Triggered branch:** ${TRIGGERED_BRANCH:-}"
  echo "- **Commit SHA:** ${COMMIT_SHA:-}"
  echo "- **iOS device:** ${IOS_DEVICE:-}"
  echo "- **Android device:** ${ANDROID_DEVICE:-}"
  echo "$FILTER_SUMMARY"
  echo "- **Smoke tests:** ${SMOKE_TESTS:-}"
  echo "- **Firebase env to target:** ${BUILD_TYPE:-}"
  echo "- **Broadcast enabled (iOS):** ${IOS_BROADCAST_ENABLED:-}"
  echo "- **Broadcast enabled (Android):** ${ANDROID_BROADCAST_ENABLED:-}"
  echo "- **Slack notification:** ${SLACK_NOTIF_STATUS:-}"
  echo "- **Android Feature Flags:** ${ANDROID_FEATURE_FLAGS:-}"
  echo "- **iOS Feature Flags:** ${IOS_FEATURE_FLAGS:-}"
  echo "- **JSON override feature flags:** $EXTRA_FEATURE_FLAGS"
} >> "$GITHUB_STEP_SUMMARY"
