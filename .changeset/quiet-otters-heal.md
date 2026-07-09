---
"ledger-live-desktop": minor
---

Fix desktop pre-release and nightly builds using the wrong Braze API key. Pre-release (RC) now correctly shares the production Braze app with `release` (validating the real integration before shipping, matching mobile's convention), and nightly now uses the staging Braze app (internal-only, safe for CRM to test canvases against), instead of both silently falling back to production
