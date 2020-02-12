// @flow

import { log } from "@ledgerhq/logs";
import last from "lodash/last";
import {
  encodeAccountId,
  getAccountPlaceholderName,
  getNewAccountPlaceholderName,
  libcoreNoGoBalanceHistory
} from "../../account";
import type {
  SyncConfig,
  Account,
  CryptoCurrency,
  DerivationMode
} from "../../types";
import { libcoreAmountToBigNumber } from "../buildBigNumber";
import type { CoreWallet, CoreAccount } from "../types";
import { buildOperation } from "./buildOperation";
import { buildSubAccounts } from "./buildSubAccounts";
import { minimalOperationsBuilder } from "../../reconciliation";
import { getOperationsPageSize } from "../pagination";
import getAccountBalanceHistory from "../getAccountBalanceHistory";
import { getRanges } from "../../portfolio";

// FIXME how to get that
const OperationOrderKey = {
  date: 0
};

async function queryOps(coreAccount) {
  const query = await coreAccount.queryOperations();
  await query.addOrder(OperationOrderKey.date, false);
  return query;
}

export async function buildAccount({
  coreWallet,
  coreAccount,
  currency,
  accountIndex,
  derivationMode,
  seedIdentifier,
  existingAccount,
  logId,
  syncConfig
}: {
  coreWallet: CoreWallet,
  coreAccount: CoreAccount,
  currency: CryptoCurrency,
  accountIndex: number,
  derivationMode: DerivationMode,
  seedIdentifier: string,
  existingAccount: ?Account,
  logId: number,
  syncConfig: SyncConfig
}): Promise<Account> {
  log("libcore", `sync(${logId}) start buildAccount`);

  const restoreKey = await coreAccount.getRestoreKey();

  const accountId = encodeAccountId({
    type: "libcore",
    version: "1",
    currencyId: currency.id,
    xpubOrAddress: restoreKey,
    derivationMode
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
  const accountPath = last(derivations);

  const coreBlock = await coreAccount.getLastBlock();
  const blockHeight = await coreBlock.getHeight();

  const coreFreshAddresses = await coreAccount.getFreshPublicAddresses();
  if (coreFreshAddresses.length === 0)
    throw new Error("expected at least one fresh address");

  const freshAddresses = await Promise.all(
    coreFreshAddresses.map(async item => {
      const [address, path] = await Promise.all([
        item.toString(),
        item.getDerivationPath()
      ]);

      const derivationPath = path ? `${accountPath}/${path}` : accountPath;

      return { address, derivationPath };
    })
  );
  log("libcore", `sync(${logId}) DONE coreAccount addresses`);

  const name =
    partialOperations.length === 0
      ? getNewAccountPlaceholderName({
          currency,
          index: accountIndex,
          derivationMode
        })
      : getAccountPlaceholderName({
          currency,
          index: accountIndex,
          derivationMode
        });

  const subAccounts = await buildSubAccounts({
    currency,
    coreAccount,
    accountId,
    existingAccount,
    logId
  });

  // We have pre-fetched the operations in "partial" mode
  // now we will need to complete them lazily
  const inferCoreOperation = async corePartialOperation => {
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
    async corePartialOperation =>
      buildOperation({
        coreOperation: await inferCoreOperation(corePartialOperation),
        accountId,
        currency,
        contextualSubAccounts: subAccounts
      })
  );

  log("libcore", `sync(${logId}) DONE operations`);

  const balanceHistory = {};

  if (!libcoreNoGoBalanceHistory().includes(currency.id)) {
    await Promise.all(
      getRanges().map(async range => {
        // NB if we find this not optimized, we can implement this cache strategy:
        // if for this range a balanceHistory exists in "existingAccount"
        // compare the last data point {value} with `balance`, re-calc if differ
        // also compare the last data point {date} with current date to force a re-calc every X hours.
        const h = await getAccountBalanceHistory(coreAccount, range);
        balanceHistory[range] = h;
      })
    );
  }

  log("libcore", `sync(${logId}) DONE balanceHistory`);

  const account: $Exact<Account> = {
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
    balance,
    balanceHistory,
    spendableBalance: balance, // FIXME need libcore concept
    blockHeight,
    currency,
    unit: currency.units[0],
    operationsCount: partialOperations.length,
    operations,
    pendingOperations: [],
    lastSyncDate: new Date()
  };

  if (subAccounts) {
    account.subAccounts = subAccounts;
  }

  return account;
}
