import { RecipientRequired } from "@ledgerhq/errors";
import { makeLRUCache } from "./../../cache";
import type { Account, CryptoCurrency } from "./../../types";
import type { Transaction } from "./types";
import getFeesForTransaction from "./js-getFeesForTransaction";
import { isValidRecipient } from "./logic";
import { Currency, isTaprootAddress } from "./wallet-btc";

const getCacheKeyForCalculateFees = ({
  a,
  t,
}: {
  a: Account;
  t: Transaction;
}) =>
  `${a.id}_${a.blockHeight || 0}_${t.amount.toString()}_${String(
    t.useAllAmount
  )}_${t.recipient}_${t.feePerByte ? t.feePerByte.toString() : ""}_${
    t.utxoStrategy.pickUnconfirmedRBF ? 1 : 0
  }_${t.utxoStrategy.strategy}_${String(t.rbf)}_${t.utxoStrategy.excludeUTXOs
    .map(({ hash, outputIndex }) => `${hash}@${outputIndex}`)
    .join("+")}`;

export const calculateFees = makeLRUCache(
  async ({
    account,
    transaction,
  }: {
    account: Account;
    transaction: Transaction;
  }) =>
    getFeesForTransaction({
      account,
      transaction,
    }),
  ({ account, transaction }) =>
    getCacheKeyForCalculateFees({
      a: account,
      t: transaction,
    }),
  {
    maxAge: 5 * 60 * 1000, // 5 minutes
  }
);

export const validateRecipient: (
  arg0: CryptoCurrency,
  arg1: string | null | undefined
) => Promise<{
  recipientError: Error | null | undefined;
  recipientWarning: Error | null | undefined;
}> = makeLRUCache(
  async (currency, recipient) => {
    if (!recipient) {
      return {
        recipientError: new RecipientRequired(""),
        recipientWarning: null,
      };
    }

    try {
      const recipientWarning = await isValidRecipient({
        currency,
        recipient,
      });
      return {
        recipientError: null,
        recipientWarning,
      };
    } catch (recipientError) {
      return {
        recipientError,
        recipientWarning: null,
      };
    }
  },
  (currency, recipient) => `${currency.id}_${recipient || ""}`
);

export const isTaprootRecipient: (
  arg0: CryptoCurrency,
  arg1: string
) => Promise<boolean> = makeLRUCache(
  async (currency, recipient) => {
    return isTaprootAddress(recipient, <Currency>currency.id);
  },
  (currency, recipient) => `${currency.id}_${recipient || ""}`
);
