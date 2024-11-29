import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Transaction as StellarTransaction } from "@ledgerhq/live-common/families/stellar/types";
import { Transaction as SolanaTransaction } from "@ledgerhq/live-common/families/solana/types";
import { MEMO_TAG_COINS } from "./constants";

/**
 * Retrieves the memo tag value from a transaction based on its family type.
 *
 * @param {Transaction} transaction - The transaction object from which to extract the memo tag value.
 * @returns {string | undefined} The memo tag value if the transaction family is supported, otherwise undefined.
 */
export const getMemoTagValueByTransactionFamily = (transaction: Transaction) => {
  if (!MEMO_TAG_COINS.includes(transaction?.family as string)) return undefined;
  const { family } = transaction;
  switch (family) {
    case "xrp":
      return transaction?.tag;
    case "ton":
      return transaction?.comment?.text;
    case "stellar":
      return (transaction as StellarTransaction)?.memoValue;
    case "solana":
      return (
        transaction as SolanaTransaction & {
          model: {
            uiState: { memo: string };
          };
        }
      )?.model.uiState.memo;
    case "casper":
      return transaction?.transferId;
    default:
      return (transaction as Transaction & { memo: string })?.memo;
  }
};
