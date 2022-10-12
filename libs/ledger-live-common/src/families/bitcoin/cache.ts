import { RecipientRequired } from "@ledgerhq/errors";
import { makeLRUCache } from "./../../cache";
import type { Transaction } from "./types";
import getFeesForTransaction from "./js-getFeesForTransaction";
import { isValidRecipient } from "./logic";
import { Currency, isTaprootAddress } from "./wallet-btc";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const getCacheKeyForCalculateFees = ({
  a,
  t,
}: {
  a: Account;
  t: Transaction;
}) =>
  `${a.id}_${a.blockHeight || 0}_${t.amount.toString()}_${String(
    t.useAllAmount
  )}_${t.recipient}_${t.feePerByte ? t.feePerByte.toString() : ""}_${0}_${
    t.utxoStrategy.strategy
  }_${String(t.rbf)}_${t.utxoStrategy.excludeUTXOs
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
    } catch (e) {
      return {
        recipientError: e instanceof Error ? e : null,
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
