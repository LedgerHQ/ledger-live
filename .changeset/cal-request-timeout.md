---
"@shared/api-services": minor
"@domain/api-currency-token": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Each CAL request attempt now ends after 30 seconds, and a timed-out attempt is not retried. A hung CAL no longer keeps token account sync (evm, cardano, celo…) or app loading waiting for ever: sync shows its error indicator instead. The sync hash requests (`getTokensSyncHash`, `getTokenListHash`) now go through the shared CAL base query, so they get the same timeout, cancellation and retries as the other CAL requests.
