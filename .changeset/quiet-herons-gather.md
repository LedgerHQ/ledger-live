---
"@ledgerhq/coin-tron": minor
---

Check the Tronify rent payment before signing: it must pay an address from the remote `paymentAddresses` list (the option stays hidden without one) and cost at most the fee approved on Review plus `rentPriceMargin` (5%), capped at `maxRentAmount` (10 USDT); `buildEnergyRentRequest` now takes that approved fee.
