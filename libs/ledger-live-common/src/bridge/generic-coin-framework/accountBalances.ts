import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { CryptoCurrencyIdSchema, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { AccountIdSchema, type AccountId } from "@shared/schema-primitives";
import { getCoinModuleApi } from "./api/index";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";

/**
 * One asset held at an account's address.
 *
 * Keyed by account id rather than by asset: the encoding of a token account id belongs to the
 * account layer, so callers never have to learn it. Structurally identical to
 * `AssetBalanceRow` in `@features/platform-account-data`, which this feeds — declared here rather
 * than imported, because `libs/` must not depend on `features/`.
 */
export type AssetBalanceRow = {
  accountId: AccountId;
  assetId:
    | ReturnType<typeof CryptoCurrencyIdSchema.parse>
    | ReturnType<typeof TokenCurrencyIdSchema.parse>;
  /** Total held, decimal-encoded, in the asset's smallest unit. */
  value: string;
  /** Non-spendable part of `value` — minimum balance, rent reserve, locked stake. */
  locked?: string;
  /** Set for a token account; absent for the account's native balance. */
  parentId?: AccountId;
};

/**
 * Read **every** asset balance an address holds — native and tokens — in one `getBalance` call.
 *
 * This is the granular half of `genericGetAccountShape`, on its own and stopping there: no
 * `lastBlock`, no `listOperations`, no balance-history derivation, no `Account` assembled. It is what
 * lets a caller that only needs a balance pay for only a balance.
 *
 * Family-agnostic by construction: the coin module comes from the registry
 * (`getCoinModuleApi` → `loadLocalApiForFamily`), so a family gains a granular balance read by
 * implementing `CoinModuleApi` — no change here. Callers decide *whether* to use it; that policy
 * lives in the wallet (see `@features/platform-account-data`'s capability declaration), not in this
 * function.
 *
 * @param kind `"local"` for the in-process coin module, anything else for the coin-service backend.
 */
export async function getAccountBalanceRows({
  accountId,
  currencyId,
  address,
  kind = "local",
}: {
  accountId: string;
  currencyId: string;
  address: string;
  kind?: string;
}): Promise<AssetBalanceRow[]> {
  const currency = getCryptoCurrencyById(currencyId);
  const parentId = AccountIdSchema.parse(accountId);
  const [api, bridgeApi] = await Promise.all([
    getCoinModuleApi(currency.id, kind),
    getBridgeApi(currency, currency.family),
  ]);

  const balances = await api.getBalance(
    buildContext(currency.id),
    address,
    bridgeApi.balanceOptions,
  );

  const rows: AssetBalanceRow[] = [];
  for (const { asset, value, locked } of balances) {
    if (asset.type === "native") {
      rows.push({
        accountId: parentId,
        assetId: CryptoCurrencyIdSchema.parse(currency.id),
        value: value.toString(),
        ...(locked === undefined ? {} : { locked: locked.toString() }),
      });
      continue;
    }
    // A token asset becomes a row only once the family can name the token behind it: a token
    // account's id is derived from the token, so an unresolvable asset has nowhere to go.
    const token = await bridgeApi.getTokenFromAsset?.(asset);
    if (!token) continue;
    rows.push({
      accountId: AccountIdSchema.parse(encodeTokenAccountId(accountId, token)),
      assetId: TokenCurrencyIdSchema.parse(token.id),
      value: value.toString(),
      ...(locked === undefined ? {} : { locked: locked.toString() }),
      parentId,
    });
  }
  return rows;
}
