# Commit Scopes — Canonical Enum

> Single source of truth for the `scope` field in commit messages and PR titles.
>
> **Reference:** [ADR — Harmonize type and scope across pull request titles and GitHub labels](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7266992139)  
> **Ticket:** [LIVE-27608](https://ledgerhq.atlassian.net/browse/LIVE-27608)

---

## Allowed scopes

### Apps

| Scope | Maps to |
|-------|---------|
| `lwd` | Ledger Live Desktop (`apps/ledger-live-desktop`) |
| `lwm` | Ledger Live Mobile (`apps/ledger-live-mobile`) |
| `wallet-cli` | Wallet CLI (`apps/wallet-cli`) |
| `cli` | CLI (`apps/cli`) |

### Libraries

| Scope | Maps to |
|-------|---------|
| `llc` | `libs/ledger-live-common` |
| `ui` | `libs/ui` |
| `ledgerjs` | `libs/ledgerjs` |
| `coin-modules` | `libs/coin-modules` and `libs/coin-framework` |
| `cryptoassets` | `libs/cryptoassets` |
| `live-wallet` | `libs/live-wallet` |
| `domain` | `libs/domain-service` |
| `env` | `libs/env` |
| `platform` | Platform/infra shared libs (no single package, used for cross-cutting platform concerns) |
| `live-config` | `libs/live-config` |

### Infrastructure & tooling

| Scope | Maps to |
|-------|---------|
| `ci` | GitHub Actions workflows (`.github/workflows/`) |
| `tools` | Internal tooling (`tools/`) |
| `web-tools` | Web tooling apps |
| `skills` | `.agents/skills/` AI agent skill files |
| `koda` | Koda AI assistant configuration |
| `codeowners` | `CODEOWNERS` changes |
| `deps` | Dependency updates (e.g. Renovate PRs) |
| `release` | Release process changes |

---

## Rules

- Scope is **optional** but strongly recommended.
- Use **lowercase**, **kebab-case** (e.g. `coin-modules`, not `coinModules`).
- Scope should identify the **package or area** that is the primary subject of the change — not a ticket number.
  - ❌ `fix(LIVE-33220): …` — ticket IDs are not valid scopes
  - ✅ `fix(lwd): …` with the ticket reference in the commit body or footer
- For changes that span multiple apps equally (desktop + mobile + common), prefer the most specific scope that applies, or omit the scope.
- If a change genuinely affects a package not listed here, use its directory's short name and consider opening a PR to add it to this list.

---

## Relationship to GitHub labels

The GitHub labeler (`.github/labeler.yml`) assigns labels based on file paths. Those labels are
**not** the same thing as commit scopes, though there is an intentional alignment:

| GitHub label | Corresponding scope(s) |
|---|---|
| `desktop` / `desktop-lib` | `lwd` |
| `mobile` / `mobile-lib` | `lwm` |
| `common` / `shared-lib` | `llc`, `platform` |
| `coin-modules` / `coin-modules-api` | `coin-modules` |
| `ui` | `ui` |
| `ledgerjs` | `ledgerjs` |
| `tools` | `tools` |
| `automation` | `ci` |
| `cli` | `cli` |
| `wallet-cli` | `wallet-cli` |

The `[LWD]` / `[LWM]` / `[LWDM]` prefixes that the `pr-title-from-labels` workflow injects into PR
titles are **separate** from the conventional-commit `(scope)` — they coexist on the same PR title
line, e.g. `[LWDM] feat(llc): add portfolio analytics`.
