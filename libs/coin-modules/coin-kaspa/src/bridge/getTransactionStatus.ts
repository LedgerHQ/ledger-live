import {
  AmountRequired,
  DustLimit,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import {
  calcMaxSpendableAmount,
  isValidKaspaAddress,
  parseExtendedPublicKey,
  scanUtxos,
  selectUtxos,
  UtxoStrategy,
} from "../logic";
import { KaspaAccount, Transaction, TransactionStatus } from "../types";

const getTransactionStatus = async (
  account: KaspaAccount,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};

  let estimateFee: BigNumber = BigNumber(0);

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired("");
  }

  if (!!transaction.recipient && !isValidKaspaAddress(transaction.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  if ((!transaction.amount || !transaction.amount.isGreaterThan(0)) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired("");
  }

  if (transaction.amount.gt(0) && transaction.amount.lt(20000000)) {
    errors.dustLimit = new DustLimit("");
  }

  if ((transaction.amount.gte(20000000) || transaction.useAllAmount) && !!transaction.recipient) {
    const { compressedPublicKey, chainCode } = parseExtendedPublicKey(
      Buffer.from(account.xpub, "hex"),
    );

    const { utxos } = await scanUtxos(compressedPublicKey, chainCode);

    const maxSpendableAmount: BigNumber = calcMaxSpendableAmount(
      utxos,
      transaction.recipient.length > 67,
      transaction?.networkInfo
        .filter(ni => ni.label === transaction?.feesStrategy)[0]
        .amount.toNumber() || 1,
    );

    if (transaction.useAllAmount) {
      transaction.amount = maxSpendableAmount;
    }

    if (transaction.amount.gt(maxSpendableAmount)) {
      errors.amount = new NotEnoughBalance();
    } else {
      const result = selectUtxos(
        utxos,
        UtxoStrategy.FIFO,
        transaction.recipient.length > 67,
        transaction.amount,
        transaction?.networkInfo
          .filter(ni => ni.label === transaction?.feesStrategy)[0]
          .amount.toNumber() || 1,
      );
      estimateFee = result.fee;
    }
  }

  return {
    errors,
    warnings: {},
    estimatedFees: estimateFee,
    amount: transaction.amount,
    totalSpent: transaction.amount.plus(estimateFee),
  };
};

export default getTransactionStatus;
