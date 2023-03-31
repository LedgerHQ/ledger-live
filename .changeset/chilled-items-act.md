---
"live-mobile": patch
---

feat: dynamically update react-navigation header

New hook: useSetNavigationHeader that:

- Enables setting react-navigation header options dynamically.
- Resets when associated component is unmounted.

Uses hook to fix double back arrow with manager and new device select
