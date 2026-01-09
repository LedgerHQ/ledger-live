---
"@ledgerhq/live-common": minor
---

fix(wallet-api): secure domain validation for goToURL parameter

Replace regex-based URL validation with proper hostname parsing to prevent
manifest domain allowlist bypass. The previous implementation matched patterns
against the full URL string, allowing attackers to bypass restrictions with
URLs like "https://evil.example/?next=ledger.com" when "ledger.com" was
whitelisted.

Security improvements:
- Parse and validate URL hostname instead of full URL string
- Enforce HTTPS-only scheme for goToURL (reject http, javascript, data, etc.)
- Normalize hostnames (lowercase + punycode) for consistent matching
- Support exact domain matches and \*.subdomain.example.com wildcards
- Explicitly reject "\*" wildcard pattern (no match-all allowed)
- Filter out rejected goToURL from query parameters to prevent leakage

Add comprehensive test coverage for malicious bypass attempts, scheme
validation, wildcard patterns, IDN support, and deeplink attack scenarios.

Fixes vulnerability where deeplinks like:
ledgerlive://discover/<appId>?goToURL=https://evil.example/?next=ledger.com
could bypass domain restrictions and load unauthorized websites in the
Live App webview.
