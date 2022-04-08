import { RecipientRequired } from "@ledgerhq/errors";
import type { CryptoCurrency } from "../types";
import { isValidRecipient } from "../libcore/isValidRecipient";
import { makeLRUCache } from "../cache";
// TODO drop this file. move back to families
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
