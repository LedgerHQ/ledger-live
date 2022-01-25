import type {
  CryptoCurrency,
  ChildAccount,
  Account,
  BalanceHistoryCache,
} from "../../types";
import type { CoreAccount, Core } from "../../libcore/types";
import type {
  CoreTezosLikeOriginatedAccount,
  CoreTezosLikeAccount,
} from "./types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import { buildOperation } from "../../libcore/buildAccount/buildOperation";
import { minimalOperationsBuilder } from "../../reconciliation";
import {
  shortAddressPreview,
  generateHistoryFromOperations,
} from "../../account";
const OperationOrderKey = {
  date: 0,
};

async function buildOriginatedAccount({
  core,
  parentAccountId,
  currency,
  coreOriginatedAccount,
  existingOriginatedAccount,
}: {
  core: Core;
  parentAccountId: string;
  currency: CryptoCurrency;
  coreOriginatedAccount: CoreTezosLikeOriginatedAccount;
  existingOriginatedAccount: ChildAccount;
}) {
  const balance = await libcoreAmountToBigNumber(
    await coreOriginatedAccount.getBalance()
  );
  const address = await coreOriginatedAccount.getAddress();
  const query = await coreOriginatedAccount.queryOperations();
  await query.complete();
  await query.addOrder(OperationOrderKey.date, false);
  const coreOperations = await query.execute();
  const id = `${parentAccountId}+${address}`;
  const operations = await minimalOperationsBuilder(
    (existingOriginatedAccount && existingOriginatedAccount.operations) || [],
    coreOperations,
    (coreOperation) =>
      buildOperation({
        core,
        coreOperation,
        accountId: id,
        currency,
        existingAccount: existingOriginatedAccount,
      })
  );
  const swapHistory = existingOriginatedAccount?.swapHistory || [];
  const originatedAccount: ChildAccount = {
    type: "ChildAccount",
    id,
    name: shortAddressPreview(address),
    starred: false,
    parentId: parentAccountId,
    currency,
    address,
    balance,
    operationsCount: operations.length,
    operations,
    pendingOperations: [],
    creationDate:
      operations.length > 0
        ? operations[operations.length - 1].date
        : new Date(),
    swapHistory,
    balanceHistoryCache: {} as BalanceHistoryCache,
  };
  originatedAccount.balanceHistoryCache =
    generateHistoryFromOperations(originatedAccount);
  return originatedAccount;
}

async function tezosBuildOriginatedAccount({
  core,
  currency,
  coreAccount,
  accountId,
  existingAccount,
}: {
  core: Core;
  currency: CryptoCurrency;
  coreAccount: CoreAccount;
  accountId: string;
  existingAccount: Account | null | undefined;
}): Promise<ChildAccount[] | null | undefined> {
  const originatedAccounts: ChildAccount[] = [];
  const xtzAccount: CoreTezosLikeAccount =
    await coreAccount.asTezosLikeAccount();
  const coreOAS: CoreTezosLikeOriginatedAccount[] =
    await xtzAccount.getOriginatedAccounts();
  const existingAccountByAddress = {};
  const existingAccountAddresses: string[] = [];

  if (existingAccount && existingAccount.subAccounts) {
    for (const existingSubAccount of existingAccount.subAccounts) {
      if (existingSubAccount.type === "ChildAccount") {
        const { address } = existingSubAccount;
        existingAccountAddresses.push(address);
        existingAccountByAddress[address] = existingSubAccount;
      }
    }
  }

  for (const coreOA of coreOAS) {
    const address = await coreOA.getAddress();
    const existingOriginatedAccount = existingAccountByAddress[address];
    const originatedAccount = await buildOriginatedAccount({
      core,
      parentAccountId: accountId,
      currency,
      coreOriginatedAccount: coreOA,
      existingOriginatedAccount,
    });
    if (originatedAccount) originatedAccounts.push(originatedAccount);
  }

  originatedAccounts.sort((a: any, b: any) => {
    const i = existingAccountAddresses.indexOf(a.address);
    const j = existingAccountAddresses.indexOf(b.address);
    if (i === j) return 0;
    if (i < 0) return 1;
    if (j < 0) return -1;
    return i - j;
  });
  return originatedAccounts;
}

export default tezosBuildOriginatedAccount;
