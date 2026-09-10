---
"@features/flow-pay-card-auth": minor
"@features/flow-pay-card": minor
"@shared/feature-flags": minor
"ledger-live-desktop": minor
---

Complete the Card login on desktop.

The provider's page opens in the Discover webview, and no longer in a separate window. The login answers `pending`, so the attempt outlives the page while the machine waits for `ledgerlive://paytab?code=…`.

The manifest of the live app owns the origin of every hosted page. The `lwdPayTab` flag carries `baanx_login_manifest_id` and `baanx_hosted_manifest_id`, which both default to the staging manifests. The press picks the manifest: the login action opens the login one, and every other page opens the hosted one. Desktop reads no `CARD_BAANX_HOSTED_UI`.

The login block follows the design, and adds a second action for a card holder who has an account already. Mobile keeps its secure browser.
