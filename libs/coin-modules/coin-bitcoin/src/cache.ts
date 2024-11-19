import { RecipientRequired } from "@ledgerhq/errors";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import getFeesForTransaction from "./getFeesForTransaction";
import { isValidRecipient } from "./logic";
import type { Transaction } from "./types";
import { Currency, isTaprootAddress } from "./wallet-btc";

const getCacheKeyForCalculateFees = ({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}) =>
  `${account.id}_${account.blockHeight || 0}_${transaction.amount.toString()}_${String(
    transaction.useAllAmount,
  )}_${transaction.recipient}_${
    transaction.feePerByte ? transaction.feePerByte.toString() : ""
  }_${0}_${transaction.utxoStrategy.strategy}_${String(
    transaction.rbf,
  )}_${transaction.utxoStrategy.excludeUTXOs
    .map(({ hash, outputIndex }) => `${hash}@${outputIndex}`)
    .join("+")}`;

export const calculateFees = makeLRUCache(
  async ({ account, transaction }: { account: Account; transaction: Transaction }) =>
    getFeesForTransaction({
      account,
      transaction,
    }),
  ({ account, transaction }) =>
    getCacheKeyForCalculateFees({
      account,
      transaction,
    }),
  {
    ttl: 5 * 60 * 1000, // 5 minutes
  },
);

export const validateRecipient: (
  currency: CryptoCurrency,
  recipient: string | null | undefined,
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
  (currency, recipient) => `${currency.id}_${recipient || ""}`,
);

export const isTaprootRecipient: (currency: CryptoCurrency, recipient: string) => Promise<boolean> =
  makeLRUCache(
    async (currency, recipient) => {
      return isTaprootAddress(recipient, <Currency>currency.id);
    },
    (currency, recipient) => `${currency.id}_${recipient || ""}`,
  );
