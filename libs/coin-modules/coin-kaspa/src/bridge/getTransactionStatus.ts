import { KaspaAccount, Transaction, TransactionStatus } from "../types/bridge";

import { isValidKaspaAddress, parseExtendedPublicKey } from "../lib/kaspa-util";

import { InvalidAddress } from "@ledgerhq/errors";
import { scanUtxos } from "../network";
import { selectUtxos, UtxoStrategy } from "../lib/utxoSelection";
import { BigNumber } from "bignumber.js";
import { calcMaxSpendableAmount } from "../lib/utxoSelection/lib";

const getTransactionStatus = async (
  account: KaspaAccount,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};

  let estimateFee: BigNumber = BigNumber(0);

  if (!!transaction.recipient && !isValidKaspaAddress(transaction.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  if ((transaction.amount.gt(0) || transaction.useAllAmount) && !!transaction.recipient) {
    const { compressedPublicKey, chainCode } = parseExtendedPublicKey(
      Buffer.from(account.xpub, "hex"),
    );

    const { utxos } = await scanUtxos(compressedPublicKey, chainCode);

    if (transaction.useAllAmount) {
      const maxSpendableAmount: BigNumber = calcMaxSpendableAmount(
        utxos,
        transaction.recipient.length > 67,
      );

      transaction.amount = maxSpendableAmount;
    }

    const result = selectUtxos(
      utxos,
      UtxoStrategy.FIFO,
      transaction.recipient.length > 67,
      transaction.amount,
      transaction.feerate || 1,
    );

    estimateFee = result.fee;
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
