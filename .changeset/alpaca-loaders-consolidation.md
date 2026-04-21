---
"@ledgerhq/live-common": patch
---

refactor(generic-alpaca): consolidate all coin-specific lazy loaders into loaders/ directory

Move all per-family signers, bridges, and APIs that were scattered across alpaca/local/,
families/*/signer, and families/*/bridge into a single loaders/<family>.ts structure.
Coin-* imports in generic-alpaca are now confined to loaders/, keeping startup bundle clean.
