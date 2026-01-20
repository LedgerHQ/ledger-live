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
    .join("+")}_${transaction.replaceTxId || ""}`;

export const calculateFees = makeLRUCache(
  async ({ account, transaction }: { account: Account; transaction: Transaction }) => {
    return getFeesForTransaction({
      account,
      transaction,
    });
  },
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
  changeAddress?: string | undefined,
) => Promise<{
  recipientError: Error | null | undefined;
  recipientWarning: Error | null | undefined;
  changeAddressError: Error | null | undefined;
  changeAddressWarning: Error | null | undefined;
}> = makeLRUCache(
  async (currency, recipient, changeAddress) => {
    if (!recipient) {
      return {
        recipientError: new RecipientRequired(""),
        recipientWarning: null,
        changeAddressError: null,
        changeAddressWarning: null,
      };
    }

    try {
      const recipientWarning = await isValidRecipient({
        currency,
        recipient,
      });
      if (changeAddress) {
        const changeAddressWarning = await isValidRecipient({
          currency,
          recipient: changeAddress,
        });
        return {
          recipientError: null,
          recipientWarning,
          changeAddressError: null,
          changeAddressWarning,
        };
      }
      return {
        recipientError: null,
        recipientWarning,
        changeAddressError: null,
        changeAddressWarning: null,
      };
    } catch (e) {
      return {
        recipientError: e instanceof Error ? e : null,
        recipientWarning: null,
        changeAddressError: null,
        changeAddressWarning: null,
      };
    }
  },
  (currency, recipient, changeAddress) =>
    `${currency.id}_${recipient || ""}_${changeAddress || ""}`,
);

export const isTaprootRecipient: (currency: CryptoCurrency, recipient: string) => Promise<boolean> =
  makeLRUCache(
    async (currency, recipient) => {
      return isTaprootAddress(recipient, <Currency>currency.id);
    },
    (currency, recipient) => `${currency.id}_${recipient || ""}`,
  );
