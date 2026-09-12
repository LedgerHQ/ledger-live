# @domain/entity-card-asset-mapping

> [!CAUTION]
> **Status: UNSTABLE** — New package; the catalog grows as the provider's asset ids are confirmed.

Maps an asset as a card provider names it onto the Ledger currency it actually is. One catalog per
provider; Baanx is the only one so far.

## The problem

The provider names an asset with a `currency` and a `network`, and neither is a Ledger id. Nothing
downstream can price a card-linked wallet, link it to an account, or show it next to the user's own
assets without first knowing which Ledger currency it is — and `usdc` alone does not say which
chain's USDC, so the pair is what a mapping has to be keyed on.

## Usage

```ts
import { baanxAssetLedgerId } from "@domain/entity-card-asset-mapping";

baanxAssetLedgerId("usdc", "ethereum"); // "ethereum/erc20/usd__coin"
baanxAssetLedgerId("btc", "bitcoin"); // "bitcoin"
baanxAssetLedgerId("usdc", "polygon"); // undefined — not a pair the catalog covers
```

`assetMappingKey(currency, network)` builds the `{currency}.{network}` id the catalog is keyed on,
lowercased and trimmed.

## One catalog per provider

`baanxCatalog.ts` holds Baanx's ids, because they are Baanx's: another provider's `usdc` may arrive
under a different `network`, and reading both from one table would make a wrong mapping look like a
missing one. A second provider is a second `*Catalog.ts` in this package, not more keys in this one.

## Why several keys per currency

The provider's documentation names the chain in `network` (`usdt.ethereum`), while its sandbox has
answered with the ticker repeated (`usdt.usdt`). Both forms are listed against the same Ledger id, so
a wallet resolves whichever arrives. Adding a form later is one line.

An unlisted pair resolves to `undefined` rather than to a wrong currency: a caller reports the wallet
as unpriced instead of valuing it as something it is not.
