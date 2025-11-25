---
"@ledgerhq/coin-tester-solana": minor
"@ledgerhq/coin-solana": minor
"@ledgerhq/live-common": minor
---

refactor(coin-solana): remove queued and cached API wrappers

- Remove queuedInterval configuration parameter from SolanaCoinConfig
- Remove cached.ts and queued.ts network decorators
- Remove traced.ts network wrapper
- Simplify ChainAPI creation by eliminating async wrappers
- Use direct ChainAPI instances instead of Promise<ChainAPI>
- Replace LRU cache-based API factory with simple Map-based caching
- Update all API consumers to work with synchronous ChainAPI access
- Fix network import path in NFT module
- Update tests to reflect config changes
