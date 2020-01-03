// @flow

import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import eip55 from "eip55";
import { FeeNotLoaded, NotEnoughGas, NotEnoughBalance } from "@ledgerhq/errors";
import type { Account } from "../../types";
import { getGasLimit } from "./transaction";
import { isValidRecipient } from "../../libcore/isValidRecipient";
import { bigNumberToLibcoreAmount } from "../../libcore/buildBigNumber";
import type { Core, CoreCurrency, CoreAccount } from "../../libcore/types";
import type { CoreEthereumLikeTransaction, Transaction } from "./types";

const ethereumTransferMethodID = Buffer.from("a9059cbb", "hex");

const ZERO = BigNumber(0);

export async function ethereumBuildTransaction({
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
}): Promise<?CoreEthereumLikeTransaction> {
  const { subAccountId, gasPrice } = transaction;
  const subAccount = subAccountId
    ? account.subAccounts &&
      account.subAccounts.find(t => t.id === subAccountId)
    : null;
  const ethereumLikeAccount = await coreAccount.asEthereumLikeAccount();

  await isValidRecipient({
    currency: account.currency,
    recipient: transaction.recipient
  });

  const recipient = eip55.encode(transaction.recipient);

  const gasLimit = getGasLimit(transaction);

  if (!gasPrice || !gasLimit || !BigNumber(gasLimit).gt(ZERO)) {
    throw new FeeNotLoaded();
  }

  const gasPriceAmount = await bigNumberToLibcoreAmount(
    core,
    coreCurrency,
    BigNumber(gasPrice)
  );
  const gasLimitAmount = await bigNumberToLibcoreAmount(
    core,
    coreCurrency,
    BigNumber(gasLimit)
  );

  if (isCancelled()) return;
  const transactionBuilder = await ethereumLikeAccount.buildTransaction();
  if (isCancelled()) return;

  if (subAccount && subAccount.type === "TokenAccount") {
    const { balance, token } = subAccount;
    let amount;
    if (transaction.useAllAmount) {
      amount = balance;
    } else {
      if (!transaction.amount) throw new Error("amount is missing");
      amount = BigNumber(transaction.amount);
      if (amount.gt(subAccount.balance)) {
        throw new NotEnoughBalance();
      }
    }
    const to256 = Buffer.concat([
      Buffer.alloc(12),
      Buffer.from(recipient.replace("0x", ""), "hex")
    ]);
    invariant(to256.length === 32, "recipient is invalid");
    const amountHex = amount.toString(16);
    const amountBuf = Buffer.from(
      amountHex.length % 2 === 0 ? amountHex : "0" + amountHex,
      "hex"
    );
    const amount256 = Buffer.concat([
      Buffer.alloc(32 - amountBuf.length),
      amountBuf
    ]);
    const data = Buffer.concat([ethereumTransferMethodID, to256, amount256]);

    await transactionBuilder.setInputData(data.toString("hex"));

    const zeroAmount = await bigNumberToLibcoreAmount(
      core,
      coreCurrency,
      BigNumber(0)
    );
    await transactionBuilder.sendToAddress(zeroAmount, token.contractAddress);
  } else {
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
  }

  await transactionBuilder.setGasLimit(gasLimitAmount);
  if (isCancelled()) return;

  await transactionBuilder.setGasPrice(gasPriceAmount);
  if (isCancelled()) return;

  try {
    const builded = await transactionBuilder.build();
    if (isCancelled()) return;

    return builded;
  } catch (e) {
    if (subAccount && e.message === "Cannot gather enough funds.") {
      // FIXME e.message usage: we need a universal error code way. not yet the case with diff bindings
      throw new NotEnoughGas();
    }
    throw e;
  }
}

export default ethereumBuildTransaction;
