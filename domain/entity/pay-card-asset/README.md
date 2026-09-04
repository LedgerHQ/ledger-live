# @domain/entity-pay-card-asset

> [!CAUTION]
> **Status: UNSTABLE** — New package; the catalog grows as the provider's asset ids are confirmed.

Maps an asset as the Card provider names it onto the Ledger currency it actually is.

## The problem

The provider names an asset with a `currency` and a `network`, and neither is a Ledger id. Nothing
downstream can price a card-linked wallet, link it to an account, or show it next to the user's own
assets without first knowing which Ledger currency it is — and `usdc` alone does not say which
chain's USDC, so the pair is what a mapping has to be keyed on.

## Usage

```ts
import { payCardAssetLedgerId } from "@domain/entity-pay-card-asset";

payCardAssetLedgerId("usdc", "ethereum"); // "ethereum/erc20/usd__coin"
payCardAssetLedgerId("btc", "bitcoin"); // "bitcoin"
payCardAssetLedgerId("usdc", "polygon"); // undefined — not a pair the catalog covers
```

`payCardAssetKey(currency, network)` builds the `{currency}.{network}` id the catalog is keyed on,
lowercased and trimmed.

## Why several keys per currency

The provider's documentation names the chain in `network` (`usdt.ethereum`), while its sandbox has
answered with the ticker repeated (`usdt.usdt`). Both forms are listed against the same Ledger id, so
a wallet resolves whichever arrives. Adding a form later is one line.

An unlisted pair resolves to `undefined` rather than to a wrong currency: a caller reports the wallet
as unpriced instead of valuing it as something it is not.
