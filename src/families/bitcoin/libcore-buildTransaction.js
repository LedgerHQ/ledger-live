// @flow

import { BigNumber } from "bignumber.js";
import { FeeNotLoaded, InvalidAddress } from "@ledgerhq/errors";
import type { Account } from "../../types";
import { isValidRecipient } from "../../libcore/isValidRecipient";
import { bigNumberToLibcoreAmount } from "../../libcore/buildBigNumber";
import type { Core, CoreCurrency, CoreAccount } from "../../libcore/types";
import type { CoreBitcoinLikeTransaction, Transaction } from "./types";

async function bitcoinBuildTransaction({
  account,
  core,
  coreAccount,
  coreCurrency,
  transaction,
  isPartial,
  isCancelled,
}: {
  account: Account,
  core: Core,
  coreAccount: CoreAccount,
  coreCurrency: CoreCurrency,
  transaction: Transaction,
  isPartial: boolean,
  isCancelled: () => boolean,
}): Promise<?CoreBitcoinLikeTransaction> {
  const bitcoinLikeAccount = await coreAccount.asBitcoinLikeAccount();

  const isValid = await isValidRecipient({
    currency: account.currency,
    recipient: transaction.recipient,
  });

  if (isValid !== null) {
    throw new InvalidAddress("", { currencyName: account.currency.name });
  }

  const { feePerByte } = transaction;
  if (!feePerByte) throw new FeeNotLoaded();

  const fees = await bigNumberToLibcoreAmount(
    core,
    coreCurrency,
    BigNumber(feePerByte)
  );
  if (isCancelled()) return;
  const transactionBuilder = await bitcoinLikeAccount.buildTransaction(
    isPartial
  );
  if (isCancelled()) return;

  if (transaction.useAllAmount) {
    await transactionBuilder.wipeToAddress(transaction.recipient);
    if (isCancelled()) return;
  } else {
    if (!transaction.amount) throw new Error("amount is missing");
    const amount = await bigNumberToLibcoreAmount(
      core,
      coreCurrency,
      BigNumber(transaction.amount)
    );
    if (isCancelled()) return;
    await transactionBuilder.sendToAddress(amount, transaction.recipient);
    if (isCancelled()) return;
  }

  await transactionBuilder.pickInputs(0, 0xffffffff);
  if (isCancelled()) return;

  await transactionBuilder.setFeesPerByte(fees);
  if (isCancelled()) return;

  const builded = await transactionBuilder.build();
  if (isCancelled()) return;

  return builded;
}

export default bitcoinBuildTransaction;
