---
"@ledgerhq/coin-polkadot": patch
---

Flatten the `logic/` folder per ADR-049 (Option B).

Consolidate every logic test into a single `logic/tests/` folder, drop the `logic/index.ts` barrel
and reroute its `api/` and `bridge/` consumers to direct-path imports, and remove the now-dead
`package.json#exports["./logic"]` and matching `typesVersions` entry. No behavior change.
