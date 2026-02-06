import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  type GetAccountShape,
  makeSync,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { getBalance, lastBlock, listOperations } from "../logic";
import { accessProvableApi } from "../logic/accessProvableApi";
import { getPrivateBalance } from "../logic/getPrivateBalance";
import { listPrivateOperations } from "../logic/listPrivateOperations";
import { apiClient } from "../network/api";
import { patchPublicOperations } from "../network/utils";
import type {
  AleoAccount,
  AleoOperation,
  AleoUnspentRecord,
  ProvableApi,
  AleoPrivateRecord,
} from "../types";

export const getAccountShape: GetAccountShape<AleoAccount> = async infos => {
  const { initialAccount, address, derivationMode, currency } = infos;

  let viewKey: string | undefined;
  let provableApi: ProvableApi | null = null;

  if (initialAccount) {
    viewKey = decodeAccountId(initialAccount.id).customData;
    invariant(viewKey, `aleo: viewKey is missing in initialAccount ${initialAccount.id}`);

    provableApi = await accessProvableApi(
      currency,
      viewKey,
      address,
      initialAccount.aleoResources.provableApi,
    );
  }

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

  const [latestBlock, balances] = await Promise.all([
    lastBlock(currency),
    getBalance(currency, address),
  ]);

  const shouldSyncFromScratch = !initialAccount;
  const oldOperations = shouldSyncFromScratch ? [] : initialAccount?.operations ?? [];
  const latestOperation = oldOperations[0];
  const lastBlockHeight = shouldSyncFromScratch ? 0 : latestOperation?.blockHeight ?? 0;
  const oldPrivateRecordsHistory = initialAccount?.aleoResources.privateRecordsHistory ?? [];
  const latestAccountPrivateRecord = oldPrivateRecordsHistory[0];

  let lastPrivateSyncDate = initialAccount?.aleoResources.lastPrivateSyncDate ?? null;
  let privateBalance = initialAccount?.aleoResources.privateBalance ?? null;
  let latestAccountPrivateOperations: AleoOperation[] = [];
  let privateRecordsHistory: AleoPrivateRecord[] | null = null;
  let unspentPrivateRecords: AleoUnspentRecord[] | null = null;
  let newPrivateRecords: AleoPrivateRecord[] = [];

  const latestAccountPublicOperations = await listOperations({
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

  if (viewKey && provableApi && provableApi.uuid && provableApi.apiKey && provableApi.jwt?.token) {
    const [resNewPrivateRecords, resUnspentPrivateRecords] = await Promise.all([
      apiClient.getAccountOwnedRecords({
        currency,
        jwtToken: provableApi.jwt?.token,
        uuid: provableApi.uuid,
        apiKey: provableApi.apiKey,
        start: latestAccountPrivateRecord ? latestAccountPrivateRecord.block_height + 1 : 0,
      }),
      apiClient.getAccountOwnedRecords({
        currency,
        jwtToken: provableApi.jwt?.token,
        uuid: provableApi.uuid,
        apiKey: provableApi.apiKey,
        unspent: true,
      }),
    ]);

    newPrivateRecords = resNewPrivateRecords;

    latestAccountPrivateOperations = await listPrivateOperations({
      currency,
      viewKey,
      address,
      ledgerAccountId,
      privateRecords: newPrivateRecords,
    });

    // FIXME: util for deduplication and sorting
    const existingKeys = new Set(oldPrivateRecordsHistory.map(r => r.transaction_id));
    privateRecordsHistory = [
      ...oldPrivateRecordsHistory,
      ...newPrivateRecords.filter(r => !existingKeys.has(`${r.transaction_id}_${r.commitment}`)),
    ]
      .map(r => {
        const isUnspent = resUnspentPrivateRecords.some(u => u.commitment === r.commitment);

        return {
          ...r,
          transaction_id: r.transaction_id.trim(),
          transition_id: r.transition_id.trim(),
          spent: !isUnspent,
        };
      })
      .sort((a, b) => b.block_height - a.block_height);

    const privateBalanceResult = await getPrivateBalance({
      currency,
      viewKey,
      privateRecords: privateRecordsHistory,
    });

    privateBalance = privateBalanceResult.balance;
    unspentPrivateRecords = privateBalanceResult.unspentRecords;
    lastPrivateSyncDate = new Date();
  }

  const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? BigInt(0);
  const transparentBalance = new BigNumber(nativeBalance.toString());
  const spendableBalance = transparentBalance.plus(privateBalance ?? 0);

  // sort by date desc
  latestAccountPublicOperations.operations.sort((a, b) => b.date.getTime() - a.date.getTime());

  // merge old and new operations
  const mergedPublicOperations = shouldSyncFromScratch
    ? latestAccountPublicOperations.operations
    : mergeOps(oldOperations, latestAccountPublicOperations.operations);

  // patch public operations with latest private data where applicable
  const publicOperations =
    newPrivateRecords.length > 0
      ? await patchPublicOperations(
          currency,
          mergedPublicOperations as AleoOperation[],
          newPrivateRecords,
          address,
          ledgerAccountId,
          viewKey,
        )
      : mergedPublicOperations;

  // FIXME: temp operations merging, we should handle incremental sync for private operations as well instead of fetching all and merging every time
  const operations = [...publicOperations, ...latestAccountPrivateOperations].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

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
      transparentBalance,
      privateBalance,
      provableApi,
      privateRecordsHistory,
      unspentPrivateRecords,
      lastPrivateSyncDate,
    },
  };
};

export const sync = makeSync({
  getAccountShape,
  shouldMergeOps: false,
});
