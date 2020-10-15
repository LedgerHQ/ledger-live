// @flow
import eip55 from "eip55";
import {
  InvalidAddress,
  ETHAddressNonEIP,
  RecipientRequired,
} from "@ledgerhq/errors";
import type { CryptoCurrency, TransactionStatus } from "../../types";

export function isRecipientValid(currency: CryptoCurrency, recipient: string) {
  if (!recipient.match(/^0x[0-9a-fA-F]{40}$/)) return false;

  // To handle non-eip55 addresses we stop validation here if we detect
  // address is either full upper or full lower.
  // see https://github.com/LedgerHQ/ledger-live-desktop/issues/1397
  const slice = recipient.substr(2);
  const isFullUpper = slice === slice.toUpperCase();
  const isFullLower = slice === slice.toLowerCase();
  if (isFullUpper || isFullLower) return true;

  try {
    return eip55.verify(recipient);
  } catch (error) {
    return false;
  }
}

// Returns a warning if we detect a non-eip address
export function getRecipientWarning(
  currency: CryptoCurrency,
  recipient: string
) {
  if (!recipient.match(/^0x[0-9a-fA-F]{40}$/)) return null;
  const slice = recipient.substr(2);
  const isFullUpper = slice === slice.toUpperCase();
  const isFullLower = slice === slice.toLowerCase();
  if (isFullUpper || isFullLower) {
    return new ETHAddressNonEIP();
  }
  return null;
}

export function validateRecipient(
  currency: CryptoCurrency,
  recipient: string,
  { errors, warnings }: TransactionStatus
) {
  let recipientWarning = getRecipientWarning(currency, recipient);
  if (recipientWarning) {
    warnings.recipient = recipientWarning;
  }
  if (!recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (!isRecipientValid(currency, recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: currency.name,
    });
  }
}

// FIXME this is used by libcore only. will be later dropped
export default async function (
  _core: *,
  { currency, recipient }: { currency: CryptoCurrency, recipient: string }
): Promise<?Error> {
  if (recipient.match(/^0x[0-9a-fA-F]{40}$/)) {
    const slice = recipient.substr(2);
    // access address not using eip55 if they strictly are upper or lower, but provide a warning to user
    if (slice === slice.toUpperCase() || slice === slice.toLowerCase()) {
      return new ETHAddressNonEIP();
    }
    if (eip55.verify(recipient)) {
      return null;
    }
  }

  throw new InvalidAddress(null, { currencyName: currency.name });
}
