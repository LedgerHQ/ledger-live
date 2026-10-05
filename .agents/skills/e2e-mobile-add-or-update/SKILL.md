---
name: e2e-mobile-add-or-update
description: Rules for writing or updating Detox E2E tests for ledger-live-mobile. Use when adding a mobile e2e spec, creating or refactoring a page object or drawer, adding testIDs to product code for automation, adding or changing a timeout, delay or wait, or fixing a flaky mobile test. Pay tab specs that need a Card session must live under specs/paytab/.
---

Pay tab specs that need an injected Card session must live under `e2e/mobile/specs/paytab/`. `launchApp` opts in only when the spec path contains `/paytab/`.

[Read](../../../e2e/mobile/docs/add-or-update-e2e.md)
