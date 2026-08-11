---
"@features/platform-aggregated-assets": minor
"@domain/api-aggregated-assets": minor
"@domain/entity-interest-rate": minor
"@ledgerhq/live-common": minor
---

Move the dada-client platform layer (hooks, cache selectors, discovery and currency selection) into
@features/platform-aggregated-assets, leaving re-export shims at the old paths so no consumer changes
