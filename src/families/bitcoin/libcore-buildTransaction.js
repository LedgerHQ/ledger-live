// @flow
import { log } from "@ledgerhq/logs";
import { BigNumber } from "bignumber.js";
import { FeeNotLoaded, InvalidAddress } from "@ledgerhq/errors";
import type { Account } from "../../types";
import { isValidRecipient } from "../../libcore/isValidRecipient";
import { bigNumberToLibcoreAmount } from "../../libcore/buildBigNumber";
import type { Core, CoreCurrency, CoreAccount } from "../../libcore/types";
import type { CoreBitcoinLikeTransaction, Transaction } from "./types";
import { getUTXOStatus } from "./transaction";
import { promiseAllBatched } from "../../promise";
import { parseBitcoinOutput } from "./transaction";

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
  const { utxoStrategy } = transaction;

  if (transaction.useAllAmount) {
    await transactionBuilder.wipeToAddress(transaction.recipient);
    if (isCancelled()) return;
  }

  const count = await bitcoinLikeAccount.getUTXOCount();
  const objects = await bitcoinLikeAccount.getUTXO(0, count);
  const utxos = await promiseAllBatched(6, objects, parseBitcoinOutput);

  for (const utxo of utxos) {
    const s = getUTXOStatus(utxo, utxoStrategy);
    if (s.excluded) {
      log(
        "bitcoin",
        `excludeUTXO ${utxo.hash}@${utxo.outputIndex} (${s.reason})`
      );
      await transactionBuilder.excludeUtxo(utxo.hash, utxo.outputIndex);
    }
  }

  if (!transaction.useAllAmount) {
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

  await transactionBuilder.pickInputs(
    utxoStrategy.strategy,
    0 /* not used, out of int32 range issue. patched in signature time. */
  );
  if (isCancelled()) return;

  await transactionBuilder.setFeesPerByte(fees);
  if (isCancelled()) return;

  const builded = await transactionBuilder.build();
  if (isCancelled()) return;

  return builded;
}

export default bitcoinBuildTransaction;
