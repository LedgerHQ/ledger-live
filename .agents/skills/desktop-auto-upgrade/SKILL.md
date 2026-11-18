---
name: desktop-auto-upgrade
description: Use when desktop auto-upgrade could be affected. Check auto-upgrade still works.
---

From `apps/ledger-live-desktop`:

- Run `node tools/testing/autoupgrade-test.mts --update-from-feed` to check that the app upgrades.
- Run `node tools/testing/autoupgrade-test.mts --from-feed --bad-signature` to check that an update with a bad signature is not downloaded.

Each prints `PASS` or `FAIL`. For details on the commands, see [auto-upgrade.md](../../../apps/ledger-live-desktop/docs/auto-upgrade.md).
