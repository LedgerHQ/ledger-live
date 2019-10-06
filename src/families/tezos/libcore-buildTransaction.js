// @flow

import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Account } from "../../types";
import { isValidRecipient } from "../../libcore/isValidRecipient";
import {
  bigNumberToLibcoreAmount,
  bigNumberToLibcoreBigInt
} from "../../libcore/buildBigNumber";
import type { Core, CoreCurrency, CoreAccount } from "../../libcore/types";
import type {
  CoreTezosLikeOriginatedAccount,
  CoreTezosLikeAccount,
  CoreTezosLikeTransaction,
  Transaction
} from "./types";

// TODO NotEnoughGas, NotEnoughBalance ?
export async function tezosBuildTransaction({
  account,
  core,
  coreAccount,
  coreCurrency,
  transaction,
  isCancelled
}: {
  account: Account,
  core: Core,
  coreAccount: CoreAccount,
  coreCurrency: CoreCurrency,
  transaction: Transaction,
  isPartial: boolean,
  isCancelled: () => boolean
}): Promise<?CoreTezosLikeTransaction> {
  const { currency } = account;
  const { recipient, fees, gasLimit, storageLimit, subAccountId } = transaction;

  const subAccount = subAccountId
    ? account.subAccounts &&
      account.subAccounts.find(t => t.id === subAccountId)
    : null;

  let tezosAccount: ?CoreTezosLikeAccount | ?CoreTezosLikeOriginatedAccount;
  const tezosLikeAccount = await coreAccount.asTezosLikeAccount();
  if (isCancelled()) return;

  if (subAccount && subAccount.type === "ChildAccount") {
    const accounts = await tezosLikeAccount.getOriginatedAccounts();
    for (const a of accounts) {
      const addr = await a.getAddress();
      if (addr === subAccount.address) {
        tezosAccount = a;
        break;
      }
    }
    invariant(tezosAccount, "sub account not found " + subAccount.id);
  } else {
    tezosAccount = tezosLikeAccount;
  }

  await isValidRecipient({ currency, recipient });
  if (isCancelled()) return;

  if (!fees || !gasLimit || !storageLimit || !BigNumber(gasLimit).gt(0)) {
    throw new FeeNotLoaded();
  }

  const feesAmount = await bigNumberToLibcoreAmount(core, coreCurrency, fees);
  if (isCancelled()) return;

  const gasLimitAmount = await bigNumberToLibcoreAmount(
    core,
    coreCurrency,
    gasLimit
  );
  if (isCancelled()) return;

  const storageBigInt = await bigNumberToLibcoreBigInt(core, storageLimit);
  if (isCancelled()) return;

  const transactionBuilder = await tezosAccount.buildTransaction();
  if (isCancelled()) return;

  await transactionBuilder.setType(transaction.type);
  if (isCancelled()) return;

  if (transaction.useAllAmount) {
    await transactionBuilder.wipeToAddress(recipient);
    if (isCancelled()) return;
  } else {
    if (!transaction.amount) throw new Error("amount is missing");
    const amount = await bigNumberToLibcoreAmount(
      core,
      coreCurrency,
      BigNumber(transaction.amount)
    );
    if (isCancelled()) return;

    await transactionBuilder.sendToAddress(amount, recipient);
    if (isCancelled()) return;
  }

  await transactionBuilder.setGasLimit(gasLimitAmount);
  if (isCancelled()) return;

  await transactionBuilder.setFees(feesAmount);
  if (isCancelled()) return;

  await transactionBuilder.setStorageLimit(storageBigInt);
  if (isCancelled()) return;

  const builded = await transactionBuilder.build();
  if (isCancelled()) return;

  return builded;
}

export default tezosBuildTransaction;
