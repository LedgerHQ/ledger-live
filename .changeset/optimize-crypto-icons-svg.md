---
"@ledgerhq/crypto-icons-ui": minor
---

Optimized all crypto icon SVG files using SVGO, reducing total size by ~1.25 MB (939KB from optimization + 337KB from removal of oversized files). Restored `viewBox` attributes to ensure proper rendering on Ledger Live Mobile. Removed 8 oversized files (>10KB) that couldn't be reasonably optimized: D.svg (137KB), MATICX.svg (80KB), BNBX.svg (25KB), WAIFU.svg (24KB), ETHX.svg (23KB), ROCK.svg (19KB), SD.svg (18KB), INS.svg (11KB). All remaining 649 SVG files have been optimized with no visual changes, improving load times and performance across the application.

