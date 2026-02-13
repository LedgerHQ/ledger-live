import { formatAddress } from "../../utils/addressUtils";
import type { RecipientData } from "./types";

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
