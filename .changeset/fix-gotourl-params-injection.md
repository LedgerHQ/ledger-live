---
"@ledgerhq/live-common": patch
---

Keep manifest params authoritative when resolving a live app initial URL: `getInitialURL` now re-applies the trusted `manifest.params` onto an accepted `goToURL` for manifests that define params, instead of trusting the params it carries.
