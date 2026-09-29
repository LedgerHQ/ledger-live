import type { CoinModule } from "@features/platform-account-source-coin-module";
import { TokenAccountIdSchema, type AccountId, type TokenAccountId } from "@domain/entity-account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { safeEncodeTokenId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { getCoinModuleApi } from "../bridge/generic-coin-framework/api/index";
import { buildContext } from "../bridge/generic-coin-framework/api/context";
import { getBridgeApi } from "../bridge/generic-coin-framework/bridge";

/** A currency's coin module, loaded lazily through the existing registry, its context bound. */
export async function loadCoinModule(currencyId: string, kind = "local"): Promise<CoinModule> {
  const currency = getCryptoCurrencyById(currencyId);
  const [api, bridgeApi] = await Promise.all([
    getCoinModuleApi(currency.id, kind),
    getBridgeApi(currency, currency.family),
  ]);
  const context = buildContext(currency.id);
  return {
    getBalance: address => api.getBalance(context, address, bridgeApi.balanceOptions),
    listOperations: (address, { cursor, limit }) =>
      api.listOperations(context, address, { minHeight: 0, cursor, limit, order: "desc" }),
    tokenOf: async asset => bridgeApi.getTokenFromAsset?.(asset),
  };
}

/** The legacy token account id: the one the full sync and every stored account already use. */
export function tokenAccountIdOf(parentId: AccountId, tokenId: string): TokenAccountId {
  return TokenAccountIdSchema.parse(`${parentId}+${safeEncodeTokenId(tokenId)}`);
}
