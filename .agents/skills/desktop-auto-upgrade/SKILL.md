---
name: desktop-auto-upgrade
description: Check the desktop app auto-upgrade. Use when asked to check that it still works.
---

# Desktop auto-upgrade

From `apps/ledger-live-desktop`:

- Run `node tools/autoupgrade-test.mts --update-from-feed` to check that the app upgrades.
- Run `node tools/autoupgrade-test.mts --from-feed --wrong-key` to check that the update signature gets verified.

Each prints `PASS` or `FAIL`. For details on the commands, see [auto-upgrade.md](../../../apps/ledger-live-desktop/docs/auto-upgrade.md).
