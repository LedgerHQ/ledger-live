---
"@ledgerhq/wallet-pnl": patch
---

Fix the asset-detail average entry price for assets that span networks with different token decimals (e.g. USDC: 6 on Ethereum, 18 on BNB Chain). `computeAssetGroupPnL` now converts each account's balance to full units using its own currency magnitude before summing, instead of dividing the mixed-magnitude total by the magnitude read from `accounts[0]`. Previously a zero-balance account in another magnitude (e.g. an empty BNB USDC) could land at `accounts[0]` and inflate the average entry price by orders of magnitude (e.g. ~$10¹²).
