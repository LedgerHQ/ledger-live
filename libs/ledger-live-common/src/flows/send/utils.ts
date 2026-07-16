import { getMainAccount, getRecentAddressesStore } from "../../account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "../../coin-modules/transaction-types";
import { formatAddress } from "../../utils/addressUtils";
import type { RecipientData } from "./types";

function getEnsNameFromTransaction(transaction: Transaction): string | undefined {
  if (!("recipientDomain" in transaction)) return undefined;
  const domain = transaction.recipientDomain?.domain?.trim();
  return domain || undefined;
}

/**
 * Persists the send recipient in the Ledger Sync recent-addresses store after a successful broadcast.
 */
export function saveRecentSendRecipient(
  account: AccountLike,
  parentAccount: Account | null | undefined,
  transaction: Transaction,
  recipientEnsName?: string | null,
): void {
  const recipient = transaction.recipient?.trim();
  if (!recipient) return;

  const mainAccount = getMainAccount(account, parentAccount ?? undefined);
  const ensName = recipientEnsName?.trim() || getEnsNameFromTransaction(transaction);

  getRecentAddressesStore().addAddress(mainAccount.currency.id, recipient, ensName);
}

/**
 * Get the display value for a recipient (formatted address with optional ENS name).
 */
export function getRecipientDisplayValue(
  recipient: RecipientData | null,
  options?: { prefixLength?: number; suffixLength?: number },
): string {
  if (!recipient?.address) return "";

  const formattedAddress = formatAddress(recipient.address, {
    prefixLength: options?.prefixLength ?? 5,
    suffixLength: options?.suffixLength ?? 5,
  });

  if (recipient.ensName?.trim()) {
    return `${recipient.ensName} (${formattedAddress})`;
  }

  return formattedAddress;
}

/**
 * Get the prefill value for recipient search when editing from Amount step.
 */
export function getRecipientSearchPrefillValue(
  recipient: RecipientData | null,
): string | undefined {
  if (!recipient) return "";
  return recipient.ensName?.trim() ? recipient.ensName : recipient.address;
}
