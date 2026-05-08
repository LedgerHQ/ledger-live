# Test quarantine

Drop **one YAML file per quarantine entry** in this directory. Invalid entries fail the test run during loading so typos are caught early. **Expired** entries (`expiry` in the past) are ignored with a warning—renew or delete the file.

## Quick reference

| Field | Required | Description |
| ----- | -------- | ----------- |
| `team` | yes | GitHub team (e.g. `@ledgerhq/wallet-xp`) |
| `expiry` | yes | `YYYY-MM-DD` (valid through end of that UTC day) |
| `reason` | yes | Why the test is quarantined |
| `failureMode` | yes | `skip` or `optional` |
| `filter.files` | one of `files` / `title` | Glob from **repo root** (picomatch), e.g. `apps/ledger-live-desktop/tests/specs/send/**/*.spec.ts` |
| `filter.title` | one of `files` / `title` | Substring on full test title, or `/regex/flags` |

Filename = entry id: only `[A-Za-z0-9_-]+.(yml|yaml)` (e.g. `LL-5678-flaky-send.yml`).

## Example

```yaml
team: "@ledgerhq/wallet-xp"
expiry: "2026-12-31"
reason: "Waiting on backend mock LL-5678"
failureMode: optional
filter:
  files: "apps/ledger-live-desktop/tests/specs/send/newSendFlow.spec.ts"
  title: "should show fee"
```

Full API and Playwright wiring: [`libs/test-quarantine/README.md`](../libs/test-quarantine/README.md).
