import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  type GetAccountShape,
  makeSync,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { getBalance, lastBlock, listOperations, getAccountJWT } from "../logic";
import type { AleoAccount } from "../types";
import { apiClient } from "../network/api";
import { AleoJWT, AleoRegisterAccountResponse } from "../types/api";

export const getAccountShape: GetAccountShape<AleoAccount> = async infos => {
  const { initialAccount, address, derivationMode, currency } = infos;
  const provableApi = initialAccount?.aleoResources.provableApi;

  let viewKey: string | undefined;
  let apiKey: AleoRegisterAccountResponse["key"] = provableApi?.apiKey ?? "";
  let consumerId: AleoRegisterAccountResponse["consumer"]["id"] = provableApi?.consumerId ?? "";
  let jwt: AleoJWT = provableApi?.jwt ?? { token: "", exp: 0 };
  let uuid: string = provableApi?.uuid ?? "";

  if (initialAccount) {
    viewKey = decodeAccountId(initialAccount.id).customData;
    invariant(viewKey, `aleo: viewKey is missing in initialAccount ${initialAccount.id}`);

    if (!apiKey || !consumerId) {
      const username = initialAccount.freshAddress.slice(4, 15);
      const { key, consumer } = await apiClient.registerNewAccount(currency, username);

      apiKey = key;
      consumerId = consumer.id;
    }

    if (jwt.exp <= Math.floor(Date.now() / 1000)) {
      jwt = await getAccountJWT(currency, apiKey, consumerId);
    }

    if (!uuid) {
      const { uuid: accountUuid } = await apiClient.registerForScanningAccountRecords(
        currency,
        jwt.token,
        viewKey,
      );
      uuid = accountUuid;
    }
  }

  const [latestBlock, balances] = await Promise.all([
    lastBlock(currency),
    getBalance(currency, address),
  ]);

  const ledgerAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
    ...(viewKey && {
      customData: viewKey,
    }),
  });

  const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? BigInt(0);
  const transparentBalance = new BigNumber(nativeBalance.toString());
  const privateBalance = null;
  const spendableBalance = transparentBalance.plus(privateBalance ?? 0);

  const shouldSyncFromScratch = !initialAccount;
  const oldOperations = shouldSyncFromScratch ? [] : initialAccount?.operations ?? [];
  const latestOperation = oldOperations[0];
  const lastBlockHeight = shouldSyncFromScratch ? 0 : latestOperation?.blockHeight ?? 0;
  const latestAccountOperations = await listOperations({
    currency,
    address,
    ledgerAccountId,
    fetchAllPages: true,
    pagination: {
      minHeight: 0,
      order: "asc",
      ...(lastBlockHeight > 0 && { lastPagingToken: lastBlockHeight.toString() }),
    },
  });

  // sort by date desc
  latestAccountOperations.operations.sort((a, b) => b.date.getTime() - a.date.getTime());

  // merge old and new operations
  const operations = shouldSyncFromScratch
    ? latestAccountOperations.operations
    : mergeOps(oldOperations, latestAccountOperations.operations);

  return {
    type: "Account",
    id: ledgerAccountId,
    balance: spendableBalance,
    spendableBalance: spendableBalance,
    blockHeight: latestBlock.height,
    operations,
    operationsCount: operations.length,
    lastSyncDate: new Date(),
    aleoResources: {
      provableApi: {
        apiKey,
        consumerId,
        jwt,
        uuid,
      },
      transparentBalance,
      privateBalance,
    },
  };
};

export const sync = makeSync({
  getAccountShape,
});
