---
"ledger-live-desktop": patch
---

Fix Market Price and Assets list displaying `0.00` for micro-cap tokens (e.g. `$0.00000591`). Introduce a reusable `fiatPriceFormat` helper that auto-picks `subMagnitude` / `disableRounding` so prices below 1 base unit keep up to 8 fractional digits, while standard prices still render with normal grouping.
