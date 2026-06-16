---
"live-mobile": patch
---

Market Banner improvements on the Home screen:

- Replace the filter MediaButton with a right-aligned text + chevron control using the text-muted color (and its pressed token), keeping a clean 12px gap below the section title.
- Ignore the persisted ranking filter when asset discoverability is off (fall back to the default ranking), instead of keeping the previously selected filter applied. The stored preference is preserved for when the feature is re-enabled.
