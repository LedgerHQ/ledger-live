// @flow

import { BigNumber } from "bignumber.js";
import { FeeNotLoaded, InvalidAddress } from "@ledgerhq/errors";
import type { Account } from "../../types";
import { isValidRecipient } from "../../libcore/isValidRecipient";
import { bigNumberToLibcoreAmount } from "../../libcore/buildBigNumber";
import type { Core, CoreCurrency, CoreAccount } from "../../libcore/types";
import type { CoreRippleLikeTransaction, Transaction } from "./types";

// TODO figure out what to do with base reserve
async function rippleBuildTransaction({
  account,
  core,
  coreAccount,
  coreCurrency,
  transaction,
  isCancelled,
}: {
  account: Account,
  core: Core,
  coreAccount: CoreAccount,
  coreCurrency: CoreCurrency,
  transaction: Transaction,
  isCancelled: () => boolean,
}): Promise<?CoreRippleLikeTransaction> {
  const rippleLikeAccount = await coreAccount.asRippleLikeAccount();

  const isValid = await isValidRecipient({
    currency: account.currency,
    recipient: transaction.recipient,
  });

  if (isValid !== null) {
    throw new InvalidAddress("", { currencyName: account.currency.name });
  }

  const { fee, tag } = transaction;
  if (!fee) throw new FeeNotLoaded();

  const fees = await bigNumberToLibcoreAmount(
    core,
    coreCurrency,
    BigNumber(fee)
  );
  if (isCancelled()) return;
  const transactionBuilder = await rippleLikeAccount.buildTransaction();
  if (isCancelled()) return;

  if (tag) {
    await transactionBuilder.setDestinationTag(tag);
    if (isCancelled()) return;
  }

  if (transaction.useAllAmount) {
    await transactionBuilder.wipeToAddress(transaction.recipient);
    if (isCancelled()) return;
  } else {
    const amount = await bigNumberToLibcoreAmount(
      core,
      coreCurrency,
      BigNumber(transaction.amount)
    );
    if (isCancelled()) return;
    await transactionBuilder.sendToAddress(amount, transaction.recipient);
    if (isCancelled()) return;
  }

  await transactionBuilder.setFees(fees);
  if (isCancelled()) return;

  const builded = await transactionBuilder.build();
  if (isCancelled()) return;

  return builded;
}

export default rippleBuildTransaction;
