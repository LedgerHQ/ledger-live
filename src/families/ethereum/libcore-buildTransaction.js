// @flow

import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import eip55 from "eip55";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { TokenAccount, Account, Transaction } from "../../types";
import { isValidRecipient } from "../../libcore/isValidRecipient";
import { bigNumberToLibcoreAmount } from "../../libcore/buildBigNumber";
import type { Core, CoreCurrency, CoreAccount } from "../../libcore/types";
import type { CoreEthereumLikeTransaction } from "./types";

const ethereumTransferMethodID = Buffer.from("a9059cbb", "hex");

export async function ethereumBuildTransaction({
  account,
  tokenAccount,
  core,
  coreAccount,
  coreCurrency,
  transaction,
  isCancelled
}: {
  account: Account,
  tokenAccount: ?TokenAccount,
  core: Core,
  coreAccount: CoreAccount,
  coreCurrency: CoreCurrency,
  transaction: Transaction,
  isPartial: boolean,
  isCancelled: () => boolean
}): Promise<?CoreEthereumLikeTransaction> {
  const ethereumLikeAccount = await coreAccount.asEthereumLikeAccount();

  await isValidRecipient({
    currency: account.currency,
    recipient: transaction.recipient
  });

  const recipient = eip55.encode(transaction.recipient);

  const { gasPrice, gasLimit } = transaction;
  if (!gasPrice || !gasLimit) throw new FeeNotLoaded();

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

  if (tokenAccount) {
    const { balance, token } = tokenAccount;
    let amount;
    if (transaction.useAllAmount) {
      amount = balance;
    } else {
      if (!transaction.amount) throw new Error("amount is missing");
      amount = BigNumber(transaction.amount);
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

  const builded = await transactionBuilder.build();
  if (isCancelled()) return;

  return builded;
}

export default ethereumBuildTransaction;
