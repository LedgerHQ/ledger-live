---
"live-mobile": minor
"ledger-live-desktop": minor
"@ledgerhq/live-countervalues": minor
---

Display a 1D variation for held assets instead of "-": when an asset's 24h portfolio value change is unavailable (e.g. freshly-acquired positions whose 24h-ago balance was zero), fall back to the asset's 1D price change computed locally from countervalues, expressed in the user's counter-value currency. This applies uniformly to crypto, stablecoins and stocks, and is handled in the shared trend hooks so generic display components stay decoupled from any asset category. A flat price now renders a real 0% (instead of "-"), and the fallback stays neutral when a rate is missing.
