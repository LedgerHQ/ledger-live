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
import { parseBitcoinUTXO, perCoinLogic } from "./transaction";

async function bitcoinBuildTransaction({
  account,
  core,
  coreAccount,
  coreCurrency,
  transaction,
  isPartial,
  isCancelled,
}: {
  account: Account;
  core: Core;
  coreAccount: CoreAccount;
  coreCurrency: CoreCurrency;
  transaction: Transaction;
  isPartial: boolean;
  isCancelled: () => boolean;
}): Promise<CoreBitcoinLikeTransaction | null | undefined> {
  const { currency } = account;
  const perCoin = perCoinLogic[currency.id];
  const recipient = perCoin?.asLibcoreTransactionRecipient
    ? perCoin.asLibcoreTransactionRecipient(transaction.recipient)
    : transaction.recipient;
  const bitcoinLikeAccount = await coreAccount.asBitcoinLikeAccount();
  const isValid = await isValidRecipient({
    currency,
    recipient,
  });

  if (isValid !== null) {
    throw new InvalidAddress("", {
      currencyName: currency.name,
    });
  }

  const { feePerByte } = transaction;
  if (!feePerByte) throw new FeeNotLoaded();
  const fees = await bigNumberToLibcoreAmount(
    core,
    coreCurrency,
    new BigNumber(feePerByte)
  );
  if (isCancelled()) return;
  const transactionBuilder = await bitcoinLikeAccount.buildTransaction(
    isPartial
  );
  if (isCancelled()) return;
  const { utxoStrategy } = transaction;

  if (transaction.useAllAmount) {
    await transactionBuilder.wipeToAddress(recipient);
    if (isCancelled()) return;
  }

  const count = await bitcoinLikeAccount.getUTXOCount();
  const objects = await bitcoinLikeAccount.getUTXO(0, count);
  let utxos = await promiseAllBatched(6, objects, parseBitcoinUTXO);

  if (perCoin) {
    const { syncReplaceAddress } = perCoin;

    if (syncReplaceAddress) {
      utxos = utxos.map((u) => ({
        ...u,
        address: u.address && syncReplaceAddress(account, u.address),
      }));
    }
  }

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
      new BigNumber(transaction.amount)
    );
    if (isCancelled()) return;
    await transactionBuilder.sendToAddress(amount, recipient);
    if (isCancelled()) return;
  }

  await transactionBuilder.pickInputs(
    utxoStrategy.strategy,
    0
    /* not used, out of int32 range issue. patched in signature time. */
  );
  if (isCancelled()) return;
  await transactionBuilder.setFeesPerByte(fees);
  if (isCancelled()) return;
  const builded = await transactionBuilder.build();
  if (isCancelled()) return;
  return builded;
}

export default bitcoinBuildTransaction;
