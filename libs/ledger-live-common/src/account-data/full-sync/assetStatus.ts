import type { Account } from "@ledgerhq/types-live";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { AccountTarget } from "@domain/api-account-data";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  AccountAssetStatusSchema,
  type AccountAssetStatus,
  type AssetStatus,
  type AssetStatusQuery,
} from "@domain/entity-account-status";
import { resolveFamily } from "../../bridge/zcashRouting";
import { loadAssetStatusForFamily } from "../../coin-modules/registry";
import { FullSyncAssetNotOnAccountError, FullSyncQueryRequiredError } from "./errors";

const noGate: AssetStatus = { gate: null };

/** The `assetStatus` kind: the asset is checked against the account's network first, and only a family with activation syncs. `assetId` is opaque: the token store tells its network. */
export async function toAssetStatus(
  target: AccountTarget,
  query: AssetStatusQuery | undefined,
  sync: (target: AccountTarget) => Promise<Account>,
): Promise<AccountAssetStatus> {
  if (!query) throw new FullSyncQueryRequiredError("assetStatus reads one asset: pass its assetId");
  const { assetId } = query;
  const currency = getCryptoCurrencyById(currencyIdFromNetwork(target.descriptor.network));
  const answer = (status: AssetStatus) => AccountAssetStatusSchema.parse({ assetId, status });
  if (assetId === currency.id) return answer(noGate);
  const [familyAssetStatus, token] = await Promise.all([
    loadAssetStatusForFamily(resolveFamily(currency)),
    getCryptoAssetsStore().findTokenById(assetId),
  ]);
  if (!token || token.parentCurrencyId !== currency.id) {
    throw new FullSyncAssetNotOnAccountError(`${assetId} is not on ${currency.id}`);
  }
  if (!familyAssetStatus) return answer(noGate);
  return answer(familyAssetStatus(await sync(target), token));
}
