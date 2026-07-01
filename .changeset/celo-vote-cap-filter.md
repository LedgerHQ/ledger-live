---
"@ledgerhq/coin-celo": patch
---

celo: stop offering saturated validator groups in the vote flow, and refresh the validator list properly.

- The capacity check now compares the group's vote cap (`getNumVotesReceivable`) against its current total votes instead of just checking the cap is positive, so groups that are already at or above their cap are filtered out and no longer revert with "vote cap exceeded" when voting.
- `preload` now always refetches the validator groups (gated by `preloadMaxAge`) instead of skipping when a hydrated list already exists. Previously a once-cached list was pinned forever, so users never saw newly available or removed groups. Per-group capacity reads are batched into a single Multicall3 round-trip.
