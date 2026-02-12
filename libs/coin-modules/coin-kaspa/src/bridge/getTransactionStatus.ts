import {
  AmountRequired,
  DustLimit,
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import { BigNumber } from "bignumber.js";
import {
  calcMaxSpendableAmount,
  getFeeRate,
  isValidKaspaAddress,
  parseExtendedPublicKey,
  scanUtxos,
  selectUtxos,
} from "../logic";
import { MAX_UTXOS_PER_TX } from "../logic/constants";
import { KaspaAccount, Transaction, TransactionStatus } from "../types";
import { ReducedAmountUtxoWarning, UtxoLimitReachedError } from "../types/errors";

const getCachedUtxos = makeLRUCache(
  async (account: KaspaAccount) => {
    const { compressedPublicKey, chainCode } = parseExtendedPublicKey(
      Buffer.from(account.xpub, "hex"),
    );
    return await scanUtxos(compressedPublicKey, chainCode);
  },
  (account: KaspaAccount) => {
    return `${account.id}`;
  },
  minutes(1),
);

const getTransactionStatus = async (
  account: KaspaAccount,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

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

  if (transaction.feesStrategy === "custom") {
    if (!transaction.customFeeRate) {
      errors.feePerByte = new FeeNotLoaded();
    }
    if (transaction.customFeeRate?.eq(0)) {
      errors.feePerByte = new FeeRequired();
    }
  }

  if ((transaction.amount.gte(20000000) || transaction.useAllAmount) && !!transaction.recipient) {
    const { utxos } = await getCachedUtxos(account);

    const maxSpendableAmount: BigNumber = calcMaxSpendableAmount(
      utxos,
      transaction.recipient.length > 67,
      getFeeRate(transaction).toNumber() || 1,
    );

    if (transaction.useAllAmount) {
      transaction.amount = maxSpendableAmount;
      if (transaction.amount.lt(20000000)) {
        errors.dustLimit = new DustLimit("");
      }
      if (utxos.length > MAX_UTXOS_PER_TX) {
        warnings.amount = new ReducedAmountUtxoWarning();
      }
    }

    if (transaction.amount.gt(maxSpendableAmount) || maxSpendableAmount.eq(0)) {
      if (utxos.length > MAX_UTXOS_PER_TX && account.balance.gt(transaction.amount)) {
        errors.amount = new UtxoLimitReachedError();
      } else {
        errors.amount = new NotEnoughBalance();
      }
    }

    if (Object.keys(errors).length === 0) {
      const result = selectUtxos(
        utxos,
        transaction.recipient.length > 67,
        transaction.amount,
        getFeeRate(transaction).toNumber() || 1,
      );
      estimateFee = result.fee;

      if (estimateFee.div(transaction.amount).gt(0.1)) {
        warnings.feeTooHigh = new FeeTooHigh();
      }
    }
  }

  return {
    errors,
    warnings,
    estimatedFees: estimateFee,
    amount: transaction.amount,
    totalSpent: transaction.amount.plus(estimateFee),
  };
};

export default getTransactionStatus;
