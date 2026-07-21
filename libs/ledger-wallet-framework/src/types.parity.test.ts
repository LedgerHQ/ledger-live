// Compile-time structural parity guards between this package's /types and
// @ledgerhq/types-cryptoassets. If TypeScript rejects any call to `check` below,
// the types have diverged and the repoint will break consumers.
//
// Known intentional widening:
//   CryptoCurrency.coinType — legacy: CoinType (numeric enum), framework: number.
//   CoinType is assignable to number, so legacy objects satisfy framework types (✓).
//   The reverse (number → CoinType) fails by design; number is not a named enum value.
//   Consequence: CryptoCurrency / Currency / CryptoOrTokenCurrency are only tested
//   in the Legacy → Framework direction.

import type * as Legacy from "@ledgerhq/types-cryptoassets";

import type {
  CryptoCurrencyId,
  CryptoOrTokenCurrency,
  CryptoCurrency,
  Currency,
  ExplorerView,
  FiatCurrency,
  LedgerExplorerId,
  TokenCurrency,
  Unit,
} from "./types";

// Type-level assertion: fails to compile when `value` is not assignable to `T`.
function check<T>(_value: T): void {}

// oxlint-disable-next-line typescript/consistent-type-assertions
function as<T>(): T {
  return undefined as unknown as T;
}

describe("types parity with @ledgerhq/types-cryptoassets", () => {
  it("compiles — structural parity verified by TypeScript accepting this file", () => {
    // ── Primitives (bidirectional) ────────────────────────────────────────────
    check<CryptoCurrencyId>(as<Legacy.CryptoCurrencyId>());
    check<LedgerExplorerId>(as<Legacy.LedgerExplorerId>());
    check<Legacy.CryptoCurrencyId>(as<CryptoCurrencyId>());
    check<Legacy.LedgerExplorerId>(as<LedgerExplorerId>());

    // ── Unit (bidirectional) ──────────────────────────────────────────────────
    check<Unit>(as<Legacy.Unit>());
    check<Legacy.Unit>(as<Unit>());

    // ── ExplorerView (bidirectional) ──────────────────────────────────────────
    check<ExplorerView>(as<Legacy.ExplorerView>());
    check<Legacy.ExplorerView>(as<ExplorerView>());

    // ── TokenCurrency (bidirectional) ─────────────────────────────────────────
    check<TokenCurrency>(as<Legacy.TokenCurrency>());
    check<Legacy.TokenCurrency>(as<TokenCurrency>());

    // ── FiatCurrency (bidirectional) ──────────────────────────────────────────
    check<FiatCurrency>(as<Legacy.FiatCurrency>());
    check<Legacy.FiatCurrency>(as<FiatCurrency>());

    // ── CryptoCurrency (Legacy → Framework; coinType widening, see file header) ─
    check<CryptoCurrency>(as<Legacy.CryptoCurrency>());

    // ── Currency (Legacy → Framework; driven by CryptoCurrency coinType widening) ─
    check<Currency>(as<Legacy.Currency>());

    // ── CryptoOrTokenCurrency (Legacy → Framework; see coinType note above) ───
    check<CryptoOrTokenCurrency>(as<Legacy.CryptoOrTokenCurrency>());
  });
});
