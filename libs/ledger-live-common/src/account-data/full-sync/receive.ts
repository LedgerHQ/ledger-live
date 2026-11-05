import type { Account } from "@ledgerhq/types-live";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { TokenCurrency } from "@domain/entity-currency-token";
import {
  AccountAssetReceiveSchema,
  type AccountAssetReceive,
  type AccountReceive,
  type AccountReceiveQuery,
} from "@domain/entity-account-receive";
import { defaultAccountReceive } from "../../account/accountReceive";
import { resolveFamily } from "../../bridge/zcashRouting";
import {
  loadAccountReceiveForFamily,
  loadAssetActivationForFamily,
} from "../../coin-modules/registry";
import { FullSyncAssetNotOnAccountError } from "./errors";

/** A token of the account's network: it throws for any other asset. */
async function tokenOnAccount(account: Account, assetId: string): Promise<TokenCurrency> {
  const token = await getCryptoAssetsStore().findTokenById(assetId);
  if (!token || token.parentCurrencyId !== account.currency.id) {
    throw new FullSyncAssetNotOnAccountError(`${assetId} is not on ${account.currency.id}`);
  }
  return token;
}

/**
 * The `receive` kind of a synced account, for the asset the query names or its native coin:
 * its family's own rule if it has one, else the default, then whether a token needs activating,
 * which a token hidden by the user's blacklist cannot tell.
 */
export async function toAccountReceive(
  account: Account,
  query?: AccountReceiveQuery,
  blacklistedTokenIds: readonly string[] = [],
): Promise<AccountAssetReceive> {
  const family = resolveFamily(account.currency);
  const assetId = query?.assetId ?? account.currency.id;
  const token =
    assetId === account.currency.id ? undefined : await tokenOnAccount(account, assetId);
  const familyReceive = await loadAccountReceiveForFamily(family);
  const accountReceive = (familyReceive ?? defaultAccountReceive)(account);
  // Sync leaves a hidden token out of `subAccounts`, activated or not: its activation is unknown.
  const isHidden = token !== undefined && blacklistedTokenIds.includes(token.id);
  const isActivationRequired =
    token && !isHidden ? await loadAssetActivationForFamily(family) : undefined;
  const receive: AccountReceive =
    accountReceive.status === "ready" && token && isActivationRequired?.(account, token)
      ? { status: "assetActivationRequired" }
      : accountReceive;
  return AccountAssetReceiveSchema.parse({ assetId, receive });
}
