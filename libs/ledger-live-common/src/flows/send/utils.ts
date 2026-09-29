import { getMainAccount, getRecentAddressesStore } from "../../account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "../../coin-modules/transaction-types";
import { formatAddress } from "../../utils/addressUtils";
import type { Memo, RecipientData } from "./types";

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

/** Number of characters displayed on each side of the ellipsis in the send flow. */
export const SEND_ADDRESS_FORMAT_OPTIONS = { prefixLength: 8, suffixLength: 8 } as const;

const RECIPIENT_ADDRESS_PLACEHOLDERS: Readonly<Record<string, string>> = {
  evm: "e.g. 0x4F10eb44…",
  ethereum: "e.g. 0x4F10eb44…",
  bitcoin: "e.g. bc1qar0srrr7…",
  solana: "e.g. 7xKXtg2CW87d…",
  tron: "e.g. TR7NHqjeKQxG…",
  ripple: "e.g. rEb8TK3gBgk5…",
  xrp: "e.g. rEb8TK3gBgk5…",
  stellar: "e.g. GAAZI4TCR3TY…",
  sui: "e.g. 0x02a212de6a9d…",
  hedera: "e.g. 0.0.1234567",
  tezos: "e.g. tz1VSUr8wwNh…",
  cardano: "e.g. addr1qx2fxv2u…",
  canton: "e.g. alice::1220a1b2c3…",
};

export function getRecipientAddressPlaceholder(family: string | undefined): string {
  return RECIPIENT_ADDRESS_PLACEHOLDERS[family ?? ""] ?? RECIPIENT_ADDRESS_PLACEHOLDERS.evm;
}

/**
 * Get the display value for a recipient (displayLabel, or formatted address with optional ENS name).
 */
export function getRecipientDisplayValue(
  recipient: RecipientData | null,
  options?: { prefixLength?: number; suffixLength?: number },
): string {
  if (!recipient) return "";

  if (recipient.displayLabel?.trim()) {
    return recipient.displayLabel.trim();
  }

  if (!recipient.address) return "";

  const formattedAddress = formatAddress(recipient.address, {
    prefixLength: options?.prefixLength ?? SEND_ADDRESS_FORMAT_OPTIONS.prefixLength,
    suffixLength: options?.suffixLength ?? SEND_ADDRESS_FORMAT_OPTIONS.suffixLength,
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

/**
 * Resolves which recipient to persist when the memo changes.
 */
export function buildRecipientForMemoChange(
  searchValue: string,
  previousRecipient: RecipientData | null,
  memo: Memo,
): RecipientData {
  const previousAddress = previousRecipient?.address;
  const previousEnsName = previousRecipient?.ensName;
  const searchMatchesPrevious =
    searchValue.length > 0 && (searchValue === previousAddress || searchValue === previousEnsName);

  if (searchMatchesPrevious) {
    return {
      address: previousAddress ?? searchValue,
      ensName: previousEnsName,
      displayLabel: previousRecipient?.displayLabel,
      contactId: previousRecipient?.contactId,
      memo,
    };
  }

  return {
    address: searchValue,
    ensName: undefined,
    displayLabel: undefined,
    memo,
  };
}
