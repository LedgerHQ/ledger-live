---
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
---

fix(wallet-api): add domain validation for customDappUrl

Add security checks to ensure customDappUrl can only be applied when it
matches the domain of the original manifest URL (params.dappUrl or
manifest.url for dapp manifests).

This prevents potential security issues from cross-domain URL manipulation
while maintaining backward compatibility for same-domain URL customization.
