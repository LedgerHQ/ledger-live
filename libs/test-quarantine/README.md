# @ledgerhq/test-quarantine

YAML-driven quarantine for Playwright (trial) and future Jest support.

## Layout

Add one YAML file per entry under the monorepo **`/quarantine/`** directory (repo root). The file basename (without extension) is the quarantine **`id`**.

## Schema

```yaml
team: "@ledgerhq/wallet-xp"
expiry: "2026-06-30"
reason: "Flaky after refactor LL-1234"
failureMode: optional # skip | optional
filter:
  files: "apps/ledger-live-desktop/tests/specs/services/cosmosStaking.spec.ts"
  title: "Cosmos staking"
```

- **`team`**: owning GitHub team handle (shown in skip message).
- **`expiry`**: `YYYY-MM-DD` (UTC end-of-day). Expired files are ignored with a warning.
- **`reason`**: free text (required); included in skip message / annotation.
- **`failureMode`**:
  - `skip`: test is skipped before it runs.
  - `optional`: test runs; failures are logged as `QUARANTINE-FLAKY` and do not fail the Playwright process if **all** failing tests were optional quarantines.
- **`filter`**: at least one of:
  - **`files`**: picomatch glob relative to the **monorepo root** (POSIX `/`).
  - **`title`**: substring match against the full Playwright title (`describe > … > test`). Use `/pattern/flags` for a regular expression instead.

When both `files` and `title` are set, **both** must match.

## Playwright

- **Fixture**: `import { withQuarantine } from "@ledgerhq/test-quarantine/playwright/fixture"` then wrap your base `test`.
- **Reporter**: add `["@ledgerhq/test-quarantine/playwright/reporter"]` to `playwright.config.ts` `reporter` so optional failures can downgrade the exit code.

See [`quarantine/README.md`](../../quarantine/README.md) for contributor-facing docs.
