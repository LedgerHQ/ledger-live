import { formatAddress } from "LLD/features/ModularDialog/components/Address/formatAddress";

export type RecipientLike = Readonly<{
  address?: string;
  ensName?: string;
}>;

export function getRecipientDisplayValue(recipient: RecipientLike | null): string | undefined {
  if (!recipient) return "";

  const formattedAddress = formatAddress(recipient.address, {
    prefixLength: 5,
    suffixLength: 5,
  });

  if (recipient.ensName?.trim()) {
    return `${recipient.ensName} (${formattedAddress})`;
  }

  return formattedAddress;
}

export function getRecipientSearchPrefillValue(
  recipient: RecipientLike | null,
): string | undefined {
  if (!recipient) return "";
  return recipient.ensName?.trim() ? recipient.ensName : recipient.address;
}
