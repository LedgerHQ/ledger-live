# @features/platform-quick-actions

> [!CAUTION]
> **Status: UNSTABLE** — New package; API may change.

Quick-action rules shared by Ledger Wallet Desktop and Mobile: which actions a bar shows, in which order, and whether each one is active.

Availability (ramp, swap, staking), funds and signer state are computed by each app and passed in.

## `resolveQuickActions(inputs)`

Visible actions for a scope (`wallet`, `asset`, `account`) and a platform, in display order. The wallet and asset scopes reproduce the existing Portfolio and Asset Detail bars; the account scope applies the asset rules to one account (its currency, its funds).

How to read the tables:

| Value                  | Meaning                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------ |
| active                 | Always shown and pressable                                                           |
| active if …            | Always shown; `inactive` (shown but disabled) when the condition is false            |
| shown if …             | Shown only when the condition is true; otherwise absent from the result              |
| shown; active if …     | Always shown; `inactive` when the condition is false                                 |
| —                      | Never part of that platform's bar (see below)                                        |

Why some actions are `—`:

- **Mobile** groups Receive and Send under **Transfer**, which opens the Transfer sheet; they are never separate actions.
- **Desktop** has no Transfer: Receive and Send are separate actions.
- **Desktop** bars have no Swap: it lives in the right-panel swap console.
- **Mobile** wallet bar has no Sell or Earn: the existing Portfolio bar doesn't carry them.

### Wallet scope

| Action      | Mobile                         | Desktop                  |
| ----------- | ------------------------------ | ------------------------ |
| Connect     | shown when no signer           | shown when no signer     |
| Buy a Ledger| shown when no signer           | shown when no signer     |
| Transfer    | active                         | —                        |
| Receive     | —                              | active                   |
| Swap        | active if exchange is enabled  | —                        |
| Buy         | active if exchange is enabled  | active                   |
| Sell        | —                              | active if funds          |
| Send        | —                              | active if funds          |

Without a signer, only Connect and Buy a Ledger are shown.

### Asset and account scopes

| Action   | Mobile                                     | Desktop                               |
| -------- | ------------------------------------------ | ------------------------------------- |
| Transfer | shown if accounts                          | —                                     |
| Receive  | —                                          | active                                |
| Buy      | shown if buy is available                  | shown if buy is available             |
| Swap     | shown if swap is available                 | —                                     |
| Sell     | shown if sell is available **and** funds   | shown; active if sell available and funds |
| Send     | —                                          | shown; active if funds                |
| Earn     | shown if earn is available                 | shown if earn is available; active if funds |

When the currency is not supported: mobile keeps only Transfer (like the Asset Detail Transfer button), desktop shows nothing.

**Mobile account scope without funds** is narrower: only Transfer and Buy (Buy shown if buy is available). With funds it follows the mobile column above.

## `layoutQuickActionTiles(actions, { isSendSupported })`

Mobile tile layout for the asset and account scopes (an account without funds only has Transfer · Buy).

| Case                 | Tiles                                        | In More          |
| -------------------- | -------------------------------------------- | ---------------- |
| Swap available       | Transfer · Swap · More                       | Buy, Sell, Earn  |
| Swap not available   | Transfer · active Buy · active Sell · More   | Earn             |

- More only appears when it has at least one action.
- Transfer shows as Receive when the currency can't send.
