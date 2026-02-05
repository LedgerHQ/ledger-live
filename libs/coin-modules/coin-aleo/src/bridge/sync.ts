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
import type { AleoAccount, AleoOperation, ProvableApi } from "../types";
import { listPrivateOperations } from "../logic/listPrivateOperations";
import { patchPublicOperations } from "../logic/utils";
import { AleoPrivateRecord } from "../types/api";
import { apiClient } from "../network/api";
import { getPrivateBalance } from "../logic/getPrivateBalance";

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

  const oldPrivateRecords: AleoPrivateRecord[] = initialAccount?.aleoResources.privateRecords ?? [];
  const latestAccountPrivateRecord = oldPrivateRecords[0];
  let lastPrivateSyncDate = initialAccount?.aleoResources.lastPrivateSyncDate ?? null;
  let privateBalance = initialAccount?.aleoResources.privateBalance ?? null;
  let latestAccountPrivateOperations: AleoOperation[] = [];
  let allPrivateRecords: AleoPrivateRecord[] = [];

  if (viewKey && provableApi && provableApi.uuid && provableApi.apiKey && provableApi.jwt?.token) {
    const newPrivateRecords = await apiClient.getAccountOwnedRecords({
      jwtToken: provableApi.jwt?.token,
      uuid: provableApi.uuid,
      apiKey: provableApi.apiKey,
      start: latestAccountPrivateRecord ? latestAccountPrivateRecord.block_height + 1 : 0,
    });

    latestAccountPrivateOperations = await listPrivateOperations({
      currency,
      viewKey,
      address,
      ledgerAccountId,
      privateRecords: newPrivateRecords,
    });

    allPrivateRecords = [...oldPrivateRecords, ...newPrivateRecords];
    privateBalance = await getPrivateBalance({ viewKey, privateRecords: allPrivateRecords });
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

  const publicOperations =
    allPrivateRecords.length > 0
      ? await patchPublicOperations(
          mergedPublicOperations as AleoOperation[],
          allPrivateRecords,
          address,
          ledgerAccountId,
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
      privateRecords: allPrivateRecords,
      lastPrivateSyncDate: provableApi?.scannerStatus?.synced
        ? new Date()
        : initialAccount?.aleoResources.lastPrivateSyncDate || null,
    },
  };
};

export const sync = makeSync({
  getAccountShape,
});
