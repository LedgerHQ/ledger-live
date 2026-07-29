---
"live-mobile": patch
---

Remove two dead navigator screens that were registered but unreachable.

- `RegionSettings`: orphaned since its only entry point (`RegionRow`) was removed in PR #1000 (2022). Removed the screen registration, `Region` screen, `regions.json` (~36 KB dropped from the bundle), the `ScreenName.RegionSettings` enum member, and the now-unused `setLocale` Redux chain (action, action type, payload type, reducer handler). No behavioral change — `locale` still resolves from the language default and imported settings.
- `AnalyticsAllocation`: legacy allocation screen superseded by the MVVM Analytics `DetailedAllocation`. Removed the registration and the legacy `Allocation`/`RingChart`/`DistributionCard` component cluster.
