import { log } from "@ledgerhq/logs";
import last from "lodash/last";
import {
  encodeAccountId,
  isAccountEmpty,
  getAccountPlaceholderName,
  getNewAccountPlaceholderName,
  libcoreNoGoBalanceHistory,
  emptyHistoryCache,
} from "../../account";
import type {
  SyncConfig,
  Account,
  CryptoCurrency,
  DerivationMode,
} from "../../types";
import { libcoreAmountToBigNumber } from "../buildBigNumber";
import type { CoreWallet, CoreAccount, Core } from "../types";
import { buildOperation } from "./buildOperation";
import { buildSubAccounts } from "./buildSubAccounts";
import { minimalOperationsBuilder } from "../../reconciliation";
import { getOperationsPageSize } from "../../pagination";
import getAccountBalanceHistory from "../getAccountBalanceHistory";
import { getRanges } from "../../portfolio";
import mergeOperationsByFamily from "../../generated/libcore-mergeOperations";
import byFamily from "../../generated/libcore-postBuildAccount";
// FIXME how to get that
const OperationOrderKey = {
  date: 0,
};
type F = (arg0: {
  account: Account;
  coreAccount: CoreAccount;
}) => Promise<Account>;

async function queryOps(coreAccount) {
  const query = await coreAccount.queryOperations();
  await query.addOrder(OperationOrderKey.date, false);
  return query;
}

export async function buildAccount({
  core,
  coreWallet,
  coreAccount,
  currency,
  accountIndex,
  derivationMode,
  seedIdentifier,
  existingAccount,
  logId,
  syncConfig,
}: {
  core: Core;
  coreWallet: CoreWallet;
  coreAccount: CoreAccount;
  currency: CryptoCurrency;
  accountIndex: number;
  derivationMode: DerivationMode;
  seedIdentifier: string;
  existingAccount: Account | null | undefined;
  logId: number;
  syncConfig: SyncConfig;
}): Promise<Account> {
  log("libcore", `sync(${logId}) start buildAccount`);
  const restoreKey = await coreAccount.getRestoreKey();
  const accountId = encodeAccountId({
    type: "libcore",
    version: "1",
    currencyId: currency.id,
    xpubOrAddress: restoreKey,
    derivationMode,
  });
  const query = await queryOps(coreAccount);
  await query.partial();
  const partialOperations = await query.execute();
  const operationsPageSize = getOperationsPageSize(accountId, syncConfig);
  const paginatedPartialOperations = isFinite(operationsPageSize)
    ? partialOperations.slice(partialOperations.length - operationsPageSize)
    : partialOperations;
  log("libcore", `sync(${logId}) DONE partial query ops`);
  const nativeBalance = await coreAccount.getBalance();
  const balance = await libcoreAmountToBigNumber(nativeBalance);
  log("libcore", `sync(${logId}) DONE balance`);
  const coreAccountCreationInfo = await coreWallet.getAccountCreationInfo(
    accountIndex
  );
  const derivations = await coreAccountCreationInfo.getDerivations();
  const accountPath: string = <string>last(derivations);
  const coreBlock = await coreAccount.getLastBlock();
  const blockHeight = await coreBlock.getHeight();
  const coreFreshAddresses = await coreAccount.getFreshPublicAddresses();
  if (coreFreshAddresses.length === 0)
    throw new Error("expected at least one fresh address");
  const freshAddresses = await Promise.all(
    coreFreshAddresses.map(async (item) => {
      const [address, path] = await Promise.all([
        item.toString(),
        item.getDerivationPath(),
      ]);
      const derivationPath: string = path
        ? `${accountPath}/${path}`
        : accountPath;
      return {
        address,
        derivationPath,
      };
    })
  );
  log("libcore", `sync(${logId}) DONE coreAccount addresses`);
  const name =
    partialOperations.length === 0
      ? getNewAccountPlaceholderName({
          currency,
          index: accountIndex,
          derivationMode,
        })
      : getAccountPlaceholderName({
          currency,
          index: accountIndex,
          derivationMode,
        });
  const subAccounts = await buildSubAccounts({
    core,
    currency,
    coreAccount,
    accountId,
    existingAccount,
    logId,
    syncConfig,
  });

  // We have pre-fetched the operations in "partial" mode
  // now we will need to complete them lazily
  const inferCoreOperation = async (corePartialOperation) => {
    const query = await queryOps(coreAccount);
    await query.limit(1);
    await query.offset(partialOperations.indexOf(corePartialOperation));
    await query.complete();
    const [coreOperation] = await query.execute();
    return coreOperation;
  };

  const operations = await minimalOperationsBuilder(
    (existingAccount && existingAccount.operations) || [],
    paginatedPartialOperations,
    async (corePartialOperation) =>
      buildOperation({
        core,
        coreOperation: await inferCoreOperation(corePartialOperation),
        accountId,
        currency,
        contextualSubAccounts: subAccounts,
        existingAccount,
      }),
    mergeOperationsByFamily[currency.family]
  );
  let lastOperation;

  if (partialOperations.length > 0) {
    if (operations.length === partialOperations.length) {
      // we already have lastOperation
      lastOperation = operations[operations.length - 1];
    } else {
      // we need to fetch lastOperation. partialOperations is older first
      const coreOperation = await inferCoreOperation(partialOperations[0]);
      lastOperation = await buildOperation({
        core,
        coreOperation,
        accountId,
        currency,
        contextualSubAccounts: subAccounts,
        existingAccount,
      });
    }
  }

  log("libcore", `sync(${logId}) DONE operations`);
  const balanceHistory = {};

  if (!libcoreNoGoBalanceHistory().includes(currency.id)) {
    await Promise.all(
      getRanges().map(async (range) => {
        // NB if we find this not optimized, we can implement this cache strategy:
        // if for this range a balanceHistory exists in "existingAccount"
        // compare the last data point {value} with `balance`, re-calc if differ
        // also compare the last data point {date} with current date to force a re-calc every X hours.
        const h = await getAccountBalanceHistory(coreAccount, range);

        if (!h[h.length - 1].value.isEqualTo(balance)) {
          log("libcore", "last data point DOES NOT match the balance!");
          return;
        }

        balanceHistory[range] = h;
      })
    );
  }

  log("libcore", `sync(${logId}) DONE balanceHistory`);
  let creationDate = new Date();

  if (lastOperation) {
    creationDate = lastOperation.date;
  }

  if (subAccounts) {
    subAccounts.forEach((a) => {
      if (a.creationDate < creationDate) {
        creationDate = a.creationDate;
      }
    });
  }

  const swapHistory = existingAccount?.swapHistory || [];
  const account: Account = {
    type: "Account",
    id: accountId,
    seedIdentifier,
    xpub: restoreKey,
    derivationMode,
    index: accountIndex,
    freshAddress: freshAddresses[0].address,
    freshAddressPath: freshAddresses[0].derivationPath,
    freshAddresses,
    name,
    starred: false,
    used: false,
    balance,
    balanceHistory,
    spendableBalance: balance, // FIXME need libcore concept
    blockHeight,
    currency,
    unit: currency.units[0],
    operationsCount: partialOperations.length,
    operations,
    pendingOperations: [],
    lastSyncDate: new Date(),
    creationDate,
    swapHistory,
    balanceHistoryCache: emptyHistoryCache, // calculated in the syncAccount function
  };

  if (subAccounts) {
    account.subAccounts = subAccounts;
  }

  account.used = !isAccountEmpty(account);
  const f: F = byFamily[currency.family];

  if (f) {
    return await f({
      account,
      coreAccount,
    });
  }

  return account;
}
