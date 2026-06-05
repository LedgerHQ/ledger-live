---
"@ledgerhq/coin-filecoin": patch
"@ledgerhq/coin-ton": patch
---

Move the transitive `zod` dependency from 3.x to 4.x in `coin-filecoin` and `coin-ton`.

- `coin-filecoin`: bump `iso-filecoin` from `^4.1.0` to `^7.4.7`, the first line that depends on `zod@4` (`^4.1.12`, resolved to the workspace `zod@4.3.6` catalog). `Message.serialize()` now returns a `Uint8Array` instead of a `Buffer`, so `toCBOR` wraps the result with `Buffer.from(...)` to preserve the existing `txPayload: Buffer` contract.
- `coin-ton`: `@ton/ton` has no `zod@4` release upstream (even the latest still declares `zod@^3`), so a scoped `pnpm.overrides` entry (`@ton/ton>zod: catalog:`) pins it to `zod@4.3.6`. `@ton/ton` only uses `zod` to validate `TonClient` HTTP responses, a path `coin-ton` does not exercise.
