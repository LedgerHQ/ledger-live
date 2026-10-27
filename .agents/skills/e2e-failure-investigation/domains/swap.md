# Domain: swap

## Test filter

- Desktop: `e2e/desktop/tests/specs/*swap*.spec.ts`, tag `@swap` or `@swapSmoke`.
- Mobile: `e2e/mobile/specs/swap/**`.
- Borderline, include when the cause is shared: market entry tests (`Buy entry point from market page`, `Delegate from market`) and discreet-mode swap tests.
- Ignore Delegate, Earn, Borrow, Send and Portfolio tests. Include them only when they show the shared cause.

## Key files

- `e2e/desktop/tests/utils/swapUtils.ts`: `performSwapUntilQuoteSelectionStep`, account selection.
- `e2e/desktop/tests/page/swap.page.ts`: `getMinimumAmount`, `fillInOriginCurrencyAmount`.
- `libs/live-e2e-shared/src/swap.ts`: `getMinimumSwapAmount` (quote probe, then fallback).
- `libs/live-e2e-shared/src/currencyUtils.ts`: `getAmountFromUSD` (countervalues API).
- `apps/ledger-live-desktop/src/mvvm/features/Market/hooks/useSwapNavigation.ts`: market entry.

## Failure signatures

| Symptom in log | Likely cause | Check |
|---|---|---|
| `market-list-data` or `market-btc-row` timeout | Market data not loaded | `429` on `/countervalue/` in network failures |
| `Could not resolve USD amount for <coin>` | `getAmountFromUSD` returned null | Log line `Failed to fetch countervalue` |
| `best-value-info-icon` not found | No quotes. Amount can be empty | `No minAmount from quote API`, then countervalue error |
| Fiat amount missing, `$***` not found | Countervalues not loaded | Same 429 search |
| `Review transaction` not found, last screen `Exchange is ready` | Device screen flow (Nano S) | Open. Compare device text with the spec |
| Waits for account dialog on market swap | App skips dialog with one account | `useSwapNavigation.ts` behavior |
| Sync button stays `disabled` | Account sync stuck | Not swap. Report as ignored |

## Chain to remember

The quote probe returns no `minAmount`. The helper falls back to the countervalues price. The price call fails and returns `null`. Then `getMinimumAmount` returns `""`, the amount field stays empty, and no quotes appear. Look at the first link, not the last.

## Environment facts

- Countervalues host: `https://global.api.prd.ledger.com/countervalue` (since #23585). The rate limit message says "600 requests per 3 minutes". Count the total load of the job.
- Swap API in E2E: staging, `https://global.api.stg.ledger-test.com/swap/v5`.
- Scheduled desktop runs rotate devices (stax, nanoGen5, nanoS).

## History

- 2026-10-21: revert #23550 removed the account dialog for single-account market swap. Fixed in #23722.
- 2026-10-22 and 10-23: 429 on the countervalues gateway breaks market and amount tests. Open.
