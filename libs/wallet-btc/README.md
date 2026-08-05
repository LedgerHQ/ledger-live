# @ledgerhq/wallet-btc

> [!NOTE]
> **Status: STABLE** — Production-proven UTXO engine, previously embedded in `@ledgerhq/coin-bitcoin`; API is considered stable.

Shared UTXO wallet engine for Bitcoin and its forks (Bitcoin Cash, Litecoin, Dogecoin, transparent Zcash, …). It owns the chain-agnostic parts of a UTXO wallet:

- **xpub scanning** — address derivation and account discovery from an extended public key;
- **coin-selection** — pluggable picking strategies (`Merge`, `CoinSelect`, `DeepFirst`, `Custom`);
- **storage** — the transaction / UTXO store used during sync;
- **address crypto** — per-network address encoding and validation.

It deliberately does **not** craft, sign, or broadcast transactions, and it has no knowledge of the Ledger Live account model — those concerns belong to the consuming coin-module (`@ledgerhq/coin-bitcoin`).

## Dependency inversion

`wallet-btc` does not depend on `@ledgerhq/ledger-wallet-framework`, `@ledgerhq/types-*` or `@ledgerhq/live-env`, nor on any currency registry. Everything currency- and network-specific is injected by the caller through a typed descriptor:

```ts
type WalletBtcCurrency = {
  id: string; // e.g. "bitcoin"
  explorerId?: string; // Ledger explorer code, e.g. "btc" (defaults to id)
  explorerEndpoint: string; // e.g. "https://explorers.api.live.ledger.com"
};
```

The caller resolves these values on its side (from the currency registry and `@ledgerhq/live-env`) and passes them in. This keeps the engine free of the Ledger Live currency registry, so it can be reused across several coin-modules. Its only `@ledgerhq` dependencies are `coin-module-framework`, `errors`, `live-network` and `logs`.

## Main exports

```ts
import wallet, {
  BitcoinLikeWallet,
  DerivationModes,
  Merge,
  CoinSelect,
  DeepFirst,
  Custom,
  isValidAddress,
  isTaprootAddress,
  type Account,
  type Currency,
  type TransactionInfo,
} from "@ledgerhq/wallet-btc/index";
```

- `BitcoinLikeWallet` (and the lazily-created default singleton) — generate, scan, and serialize accounts.
- Picking strategies — the coin-selection algorithms.
- `isValidAddress` / `isTaprootAddress` — address validation helpers.

Lower-level building blocks are available on subpaths: `@ledgerhq/wallet-btc/xpub`, `/explorer`, `/storage`, `/operations`, `/crypto/*`, `/pickingstrategies/*`.

`/operations` exposes the chain-agnostic UTXO accounting shared by consuming coin-modules: `removeReplaced` (RBF/pending deduplication) and `deduplicateOperations`.

## Usage

```ts
import BitcoinLikeWallet from "@ledgerhq/wallet-btc/wallet";
import { DerivationModes } from "@ledgerhq/wallet-btc/types";

const engine = new BitcoinLikeWallet();

const account = await engine.generateAccount(
  {
    xpub,
    path: "44'/0'",
    index: 0,
    currency: "bitcoin",
    network: "mainnet",
    derivationMode: DerivationModes.LEGACY,
  },
  { id: "bitcoin", explorerId: "btc", explorerEndpoint: "https://explorers.api.live.ledger.com" },
);

await engine.syncAccount(account);
const balance = await engine.getAccountBalance(account);
```

## Tests

- `pnpm test` — unit tests.
- `pnpm test-integ` — integration tests. They hit the live explorer; a few suites require Praline and are skipped by default.
