---
"live-mobile": patch
---

Migrate mobile empty-account checks (account/portfolio screens, asset screen, select-account, quick-actions, transfer drawer, analytics operations list, device-scan add-account flow) from the deprecated isAccountEmpty top-level helper to bridge-resolved equivalents. Replace areAccountsEmptySelector with the new useAreAccountsEmpty hook.

Also fix the Operations list empty/no-op state when filtered on token accounts whose parent is not in the filtered slice, and stabilize useAreAccountsEmpty by selecting through the existing memoized shallow accounts selector to avoid re-rendering consumers on irrelevant account updates.
