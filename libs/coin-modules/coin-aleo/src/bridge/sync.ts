import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  type GetAccountShape,
  makeSync,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { log } from "@ledgerhq/logs";
import { getBalance, lastBlock, listOperations } from "../logic";
import { accessProvableApi } from "../network/utils";
import type { AleoAccount, ProvableApi, AleoUnspentRecord } from "../types";
import { getPrivateBalance } from "../logic/getPrivateBalance";
import { isProvableApiConfigured } from "../logic/utils";
import { apiClient } from "../network/api";

export const getAccountShape: GetAccountShape<AleoAccount> = async infos => {
  const { initialAccount, address, derivationMode, currency } = infos;
  let viewKey: string | undefined;
  let provableApi: ProvableApi | null = null;

  if (initialAccount) {
    viewKey = decodeAccountId(initialAccount.id).customData;
    invariant(viewKey, `aleo: viewKey is missing in ${address} initialAccount`);

    provableApi = await accessProvableApi({
      currency,
      viewKey,
      address,
      provableApi: initialAccount.aleoResources?.provableApi ?? null,
    }).catch(err => {
      // private sync logic will be probably handled separately with https://ledgerhq.atlassian.net/browse/LIVE-26440
      // for now, if provable API access configuration fails, we still want to sync public data
      log("aleo/sync", "Error while configuring record scanner API access", { err, address });
      return initialAccount.aleoResources?.provableApi ?? null;
    });
  }

  const ledgerAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
    ...(viewKey && { customData: viewKey }),
  });

  const [latestBlock, balances] = await Promise.all([
    lastBlock(currency),
    getBalance(currency, address),
  ]);

  const blockHeight = latestBlock.height;

  const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? BigInt(0);
  const transparentBalance = new BigNumber(nativeBalance.toString());

  const shouldSyncFromScratch = !initialAccount;
  const oldOperations = shouldSyncFromScratch ? [] : initialAccount?.operations ?? [];
  const latestOperation = oldOperations[0];
  const lastBlockHeight = shouldSyncFromScratch ? 0 : latestOperation?.blockHeight ?? 0;

  const latestAccountPublicOperations = await listOperations({
    currency,
    address,
    ledgerAccountId,
    mode: "bridge",
    options: {
      minHeight: 0,
      order: "asc",
      ...(lastBlockHeight > 0 && { cursor: lastBlockHeight.toString() }),
    },
  });

  let privateBalance = initialAccount?.aleoResources?.privateBalance ?? null;
  let unspentPrivateRecords: AleoUnspentRecord[] | null = null;
  let lastPrivateSyncDate = initialAccount?.aleoResources?.lastPrivateSyncDate ?? null;

  if (viewKey && isProvableApiConfigured(provableApi)) {
    const rawUnspentPrivateRecords = await apiClient.getAccountOwnedRecords({
      currency,
      jwtToken: provableApi.jwt.token,
      uuid: provableApi.uuid,
      apiKey: provableApi.apiKey,
      unspent: true,
    });

    const privateBalanceResult = await getPrivateBalance({
      currency,
      viewKey,
      privateRecords: rawUnspentPrivateRecords,
    });

    privateBalance = privateBalanceResult.balance;
    unspentPrivateRecords = privateBalanceResult.unspentRecords;
    lastPrivateSyncDate = new Date();
  }

  const totalBalance = transparentBalance.plus(privateBalance ?? 0);

  // sort by date desc
  latestAccountPublicOperations.operations.sort((a, b) => b.date.getTime() - a.date.getTime());

  // merge old and new operations
  const operations = shouldSyncFromScratch
    ? latestAccountPublicOperations.operations
    : mergeOps(oldOperations, latestAccountPublicOperations.operations);

  return {
    type: "Account",
    id: ledgerAccountId,
    balance: totalBalance,
    spendableBalance: totalBalance,
    blockHeight,
    operations,
    operationsCount: operations.length,
    lastSyncDate: new Date(),
    aleoResources: {
      transparentBalance,
      provableApi,
      privateBalance,
      unspentPrivateRecords,
      lastPrivateSyncDate,
    },
  };
};

export const sync = makeSync({
  getAccountShape,
  shouldMergeOps: false,
});
