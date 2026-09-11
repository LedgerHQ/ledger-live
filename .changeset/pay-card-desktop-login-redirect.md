---
"@shared/feature-flags": minor
"ledger-live-desktop": minor
---

Complete the Card login on desktop. The provider's page opens in the Discover webview, and the
manifest of the live app owns its origin. The `lwdPayTab` flag carries `baanx_login_manifest_id`
and `baanx_hosted_manifest_id`, which default to the staging manifests.
