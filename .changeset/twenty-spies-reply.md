---
"ledger-live-desktop-e2e-tests": patch
"ledger-live-mobile-e2e-tests": patch
---

Align delegate and earn v2 e2e tests (desktop and mobile) with the versioned stakePrograms feature-flag values. ETH staking now redirects into the earn deposit webview instead of a native staking flow, so the affected cold-start, inline add-account, partner-dapp CTA and delegate assertions drive the deposit webview for ETH (amount → provider → partner dapp) while other assets keep the native staking checks. Keeps the test environment in sync with production.
