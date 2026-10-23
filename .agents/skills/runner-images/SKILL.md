---
name: runner-images
description: Self-hosted CI runner images in LedgerHQ/ledger-wallet-runners bake this repo's toolchain. Read before changing a version in `mise.toml` or `mise.lock` (mise itself, node, pnpm, bun or any other mise tool) or the Android AVD configuration (`AVD_*` in `test-mobile-e2e-reusable.yml`, `tools/actions/composites/setup-android-avd`, `tools/scripts/patch-avd-config.sh`).
---

# Runner images

The `ledger-wallet-*` runner images are built in [LedgerHQ/ledger-wallet-runners](https://github.com/LedgerHQ/ledger-wallet-runners). They preinstall the mise toolchain and the Android AVD. CI adapts automatically when this repo changes a version, so nothing breaks, but jobs stay slower until the image is updated to match.

## Triggers

- `mise.toml`: `min_version`, any entry under `[tools]` (node, pnpm, bun, gitleaks, hk, ...), or a tool added or removed
- `mise.lock` changes from a version bump
- AVD: any `AVD_*` env value in `.github/workflows/test-mobile-e2e-reusable.yml` (API level, arch, profile, target, cores, RAM, heap, emulator options), the `setup-android-avd` action, or `patch-avd-config.sh`

Renovate bumps count too when you are the one reviewing or editing them.

## What to do

Make the change here, then **tell the user** to update the matching image in LedgerHQ/ledger-wallet-runners, naming the old and new value. For example:

> This bumps pnpm 11.28.7 → 11.29.0. Update the runner image in LedgerHQ/ledger-wallet-runners to match.

- Don't skip the prompt because CI still passes: the cost is speed, not failures.
- Don't edit ledger-wallet-runners yourself unless asked.
- Mention it again in the PR description so reviewers see the follow-up.
