# Slack PR Message

Generate a formatted Slack message to announce a pull request.

## Format

```
:pr-open: {{PREFIX}} - {{SHORT_DESCRIPTION}}
{{PR_URL}}
```

## Prefix Rules

| Impacted packages | Prefix |
|---|---|
| `live-mobile` only | `LWM` |
| `ledger-live-desktop` only | `LWD` |
| `@ledgerhq/live-common` or shared libs | `Common` |
| CI, scripts, developer tooling | `Tooling` |
| Both `live-mobile` and `ledger-live-desktop` | `LWM + LWD` |

When multiple non-app packages are impacted alongside an app, use the app prefix. Combine prefixes only when both apps are affected.

## Example

```
:pr-open: LWM - Add portfolio analytics dashboard
https://github.com/LedgerHQ/ledger-live/pull/1234
```
