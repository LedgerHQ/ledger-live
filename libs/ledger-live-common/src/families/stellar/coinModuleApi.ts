import { createApi as createStellarApi } from "@ledgerhq/coin-stellar/api/index";
import type { CoinModuleApi, Memo, StringMemo } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

// The shared generic-coin-framework emits the framework memo union: `StringMemo`
// (`{ type: "string", kind, value }`) for a typed memo, `MemoNotSupported` (`{ type: "none" }`) for
// none. coin-stellar predates that union — it reads `memo.type` as its own Stellar memo kind and
// validates a `NO_MEMO` sentinel. Translating at this boundary keeps that quirk inside the stellar
// family, so the shared layer stays memo-union-only with no family-name branch leaking in (LIVE-35735).
// Stellar never sets a numeric tag, so the union's `MapMemo` never reaches here.
// coin-stellar's flat wire shape — `type` is the Stellar memo kind (or `NO_MEMO`), not the union's discriminant.
type StellarWireMemo = { type: string; value?: string };

function toStellarMemo(memo: Memo): StellarWireMemo {
  if (memo.type === "string") {
    const { kind, value } = memo as StringMemo<string>;
    return { type: kind, value };
  }
  return { type: "NO_MEMO" };
}

// Typed loosely because this is the seam between the two memo conventions; `toStellarMemo` is the
// typed part.
function withStellarMemo<I>(intent: I): I {
  const memo = (intent as { memo?: Memo }).memo;
  return memo === undefined ? intent : ({ ...intent, memo: toStellarMemo(memo) } as I);
}

// Config is resolved from the Context bound in getCoinModuleApi (framework v6), so createApi() takes none.
export function createLocalStellarApi(_currencyId: string): CoinModuleApi<any> & BridgeApi {
  const api = createStellarApi() as CoinModuleApi<any> & BridgeApi;
  // `craftTransaction` and `validateIntent` are the only methods that read the intent memo in
  // coin-stellar@9.0.0 (`estimateFees` ignores the intent, `craftTransactionData` returns `none`) —
  // re-verify this set on a coin-stellar upgrade.
  return {
    ...api,
    craftTransaction: (context, intent, options) =>
      api.craftTransaction(context, withStellarMemo(intent), options),
    validateIntent: (context, intent, balances, options) =>
      api.validateIntent(context, withStellarMemo(intent), balances, options),
  };
}
