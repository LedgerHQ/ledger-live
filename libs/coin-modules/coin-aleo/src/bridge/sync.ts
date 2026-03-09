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
import {
  isProvableApiConfigured,
  isRecordScannerReady,
  splitPrivateAndPublicOperations,
} from "../logic/utils";
import { accessProvableApi, patchPublicOperations } from "../network/utils";
import type { AleoAccount, AleoOperation, AleoUnspentRecord, ProvableApi } from "../types";
import { getPrivateBalance } from "../logic/getPrivateBalance";
import { listPrivateOperations } from "../logic/listPrivateOperations";
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
  const allOldOperations = shouldSyncFromScratch ? [] : initialAccount?.operations ?? [];

  // Keep public and private ops separate so each cursor is derived from the correct op type. Mixing them
  // risks using a private op's blockHeight as the public sync cursor
  const [oldPrivateOps, oldPublicOps] = splitPrivateAndPublicOperations(allOldOperations);

  const lastBlockHeight = shouldSyncFromScratch ? 0 : oldPublicOps[0]?.blockHeight ?? 0;
  const lastPrivateBlockHeight = shouldSyncFromScratch ? 0 : oldPrivateOps[0]?.blockHeight ?? 0;

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

  // sort by date desc
  latestAccountPublicOperations.operations.sort((a, b) => b.date.getTime() - a.date.getTime());

  // merge old and new public operations
  let publicOperations = shouldSyncFromScratch
    ? latestAccountPublicOperations.operations
    : (mergeOps(oldPublicOps, latestAccountPublicOperations.operations) as AleoOperation[]);

  let privateBalance = initialAccount?.aleoResources?.privateBalance ?? null;
  let unspentPrivateRecords: AleoUnspentRecord[] | null = null;
  let latestAccountPrivateOperations: AleoOperation[] = [];
  let lastPrivateSyncDate = initialAccount?.aleoResources?.lastPrivateSyncDate ?? null;

  if (viewKey && isProvableApiConfigured(provableApi) && isRecordScannerReady(provableApi)) {
    const [rawNewPrivateRecords, rawUnspentPrivateRecords] = await Promise.all([
      apiClient.getAccountOwnedRecords({
        currency,
        jwtToken: provableApi.jwt.token,
        uuid: provableApi.uuid,
        apiKey: provableApi.apiKey,
        start: lastPrivateBlockHeight,
      }),
      apiClient.getAccountOwnedRecords({
        currency,
        jwtToken: provableApi.jwt.token,
        uuid: provableApi.uuid,
        apiKey: provableApi.apiKey,
        unspent: true,
      }),
    ]);

    const [privateOperationsResult, patchedPublicOperationsResult, privateBalanceResult] =
      await Promise.all([
        listPrivateOperations({
          currency,
          viewKey,
          address,
          ledgerAccountId,
          privateRecords: rawNewPrivateRecords,
        }),
        patchPublicOperations({
          currency,
          publicOperations,
          privateRecords: rawNewPrivateRecords,
          address,
          ledgerAccountId,
          viewKey,
        }),
        getPrivateBalance({
          currency,
          viewKey,
          privateRecords: rawUnspentPrivateRecords,
        }),
      ]);

    latestAccountPrivateOperations = privateOperationsResult;
    publicOperations = patchedPublicOperationsResult;
    privateBalance = privateBalanceResult.balance;
    unspentPrivateRecords = privateBalanceResult.unspentRecords;
    lastPrivateSyncDate = new Date();
  }

  const totalBalance = transparentBalance.plus(privateBalance ?? 0);

  // merge old and new private operations — same incremental pattern as public ops;
  // deduplication is by operation id (encodeOperationId(accountId, txHash, type))
  const privateOperations = shouldSyncFromScratch
    ? latestAccountPrivateOperations
    : mergeOps(oldPrivateOps, latestAccountPrivateOperations);

  const operations = [...publicOperations, ...privateOperations].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

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
