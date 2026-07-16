---
"@ledgerhq/hw-app-btc": patch
---

Add the NU6.3 Zcash consensus branch id (0x37a5165b, mainnet activation height 3,428,143) to the transparent height→branch-id table, so transactions signed through the legacy (non-DMK) Btc path after NU6.3 activation are accepted by the network. Unknown block heights now default to the NU6.3 branch id.
