// @flow

import last from "lodash/last";
import {
  encodeAccountId,
  getAccountPlaceholderName,
  getNewAccountPlaceholderName
} from "../../account";
import type { Account, CryptoCurrency, DerivationMode } from "../../types";
import { libcoreAmountToBigNumber } from "../buildBigNumber";
import type { CoreWallet, CoreAccount, CoreOperation } from "../types";
import { buildOperation } from "./buildOperation";
import { buildSubAccounts } from "./buildSubAccounts";
import { minimalOperationsBuilder } from "../../reconciliation";

export async function buildAccount({
  coreWallet,
  coreAccount,
  coreOperations,
  currency,
  accountIndex,
  derivationMode,
  seedIdentifier,
  existingAccount
}: {
  coreWallet: CoreWallet,
  coreAccount: CoreAccount,
  coreOperations: CoreOperation[],
  currency: CryptoCurrency,
  accountIndex: number,
  derivationMode: DerivationMode,
  seedIdentifier: string,
  existingAccount: ?Account
}): Promise<Account> {
  const nativeBalance = await coreAccount.getBalance();
  const balance = await libcoreAmountToBigNumber(nativeBalance);

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

  const name =
    coreOperations.length === 0
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

  // retrieve xpub
  const xpub = await coreAccount.getRestoreKey();

  const accountId = encodeAccountId({
    type: "libcore",
    version: "1",
    currencyId: currency.id,
    xpubOrAddress: xpub,
    derivationMode
  });

  const subAccounts = await buildSubAccounts({
    currency,
    coreAccount,
    accountId,
    existingAccount
  });

  const operations = await minimalOperationsBuilder(
    (existingAccount && existingAccount.operations) || [],
    coreOperations,
    coreOperation =>
      buildOperation({
        coreOperation,
        accountId,
        currency,
        contextualSubAccounts: subAccounts
      })
  );

  const account: $Exact<Account> = {
    type: "Account",
    id: accountId,
    seedIdentifier,
    xpub,
    derivationMode,
    index: accountIndex,
    freshAddress: freshAddresses[0].address,
    freshAddressPath: freshAddresses[0].derivationPath,
    freshAddresses,
    name,
    balance,
    spendableBalance: balance, // FIXME need libcore concept
    blockHeight,
    currency,
    unit: currency.units[0],
    operations,
    pendingOperations: [],
    lastSyncDate: new Date()
  };

  if (subAccounts) {
    account.subAccounts = subAccounts;
  }

  return account;
}
