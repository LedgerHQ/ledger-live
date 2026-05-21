---
"live-mobile": patch
---

Per-family mobile accountActions (bitcoin, celo, evm, tron) now receive the resolved AccountBridge as a parameter and use bridge.isAccountEmpty instead of the deprecated top-level helper; useAccountActions resolves the bridge via useAccountBridge and passes it through.
