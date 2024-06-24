import { InvalidAddress, RecipientRequired } from "@ledgerhq/errors";
import { validateAddress, ValidationResult } from "@taquito/utils";

export const validateRecipient = (recipient: string) => {
  let recipientError: Error | null = null;
  const recipientWarning = null;
  if (!recipient) {
    recipientError = new RecipientRequired("");
  } else if (validateAddress(recipient) !== ValidationResult.VALID) {
    recipientError = new InvalidAddress(undefined, {
      currencyName: "Tezos",
    });
  }
  return Promise.resolve({ recipientError, recipientWarning });
};
