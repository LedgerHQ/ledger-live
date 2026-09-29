---
"@ledgerhq/coin-sui": major
"@ledgerhq/live-common": minor
"@shared/feature-flags": minor
"@shared/env": minor
---

Drop the Sui JSON-RPC transport, which the Sui Foundation retires, and make gRPC the default; GraphQL stays selectable through the `suiTransport` flag. coin-sui now owns the chain types it previously borrowed from `@mysten/sui/jsonRpc`.
