// @flow
import { RecipientRequired } from "@ledgerhq/errors";
import type { CryptoCurrency } from "../types";
import { isValidRecipient } from "../libcore/isValidRecipient";
import { makeLRUCache } from "../cache";

export const validateRecipient: (
  CryptoCurrency,
  ?string
) => Promise<{
  recipientError: ?Error,
  recipientWarning: ?Error
}> = makeLRUCache(
  async (currency, recipient) => {
    if (!recipient) {
      return {
        recipientError: new RecipientRequired(""),
        recipientWarning: null
      };
    }
    try {
      const recipientWarning = await isValidRecipient({ currency, recipient });
      return {
        recipientError: null,
        recipientWarning
      };
    } catch (recipientError) {
      return {
        recipientError,
        recipientWarning: null
      };
    }
  },

  (currency, recipient) => `${currency.id}_${recipient || ""}`
);
