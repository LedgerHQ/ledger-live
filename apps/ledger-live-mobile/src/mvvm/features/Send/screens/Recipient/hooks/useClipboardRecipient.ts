import Clipboard from "@react-native-clipboard/clipboard";
import { useRecipientSearchState } from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { useAddressValidation } from "./useAddressValidation";

/**
 * Avoid running bridge validation on arbitrary
 * clipboard content (e.g. prose copied from a web page). A recipient (raw address
 * or domain name) never contains whitespace and stays within a reasonable length.
 * Whether the candidate is actually a valid recipient is decided by the bridge
 * (address format) and the domain service (ENS), gated by `recipientSupportsDomain`.
 */
function isPlausibleRecipientCandidate(value: string): boolean {
  if (!value) return false;
  if (/\s/.test(value)) return false;
  return value.length >= 4 && value.length <= 120;
}

type UseClipboardRecipientProps = Readonly<{
  enabled: boolean;
  currency: CryptoCurrency | TokenCurrency;
  account?: AccountLike;
  parentAccount?: Account | null;
  currentAccountId?: string;
  recipientSupportsDomain: boolean;
}>;

type UseClipboardRecipientResult = Readonly<{
  /** The clipboard content when it is a valid recipient for the current family, otherwise null. */
  clipboardAddress: string | null;
}>;

/**
 * Reads the clipboard and exposes its content only when it is a valid recipient
 * for the current currency. Validation is fully descriptor/bridge driven (no
 * family-specific branching here): a raw address is validated by the account
 * bridge, an ENS name is resolved only when the family supports domains
 * (`recipientSupportsDomain`).
 *
 * The clipboard is (re)read every time the screen gains focus and every time the
 * app returns to the foreground, so a value copied while the app was backgrounded
 * is picked up. On iOS, reading the clipboard is gated by the OS paste permission
 * prompt; we let the OS handle that and only validate once we receive the content.
 */
export function useClipboardRecipient({
  enabled,
  currency,
  account,
  parentAccount,
  currentAccountId,
  recipientSupportsDomain,
}: UseClipboardRecipientProps): UseClipboardRecipientResult {
  const [clipboardValue, setClipboardValue] = useState("");

  const readClipboard = useCallback(async () => {
    try {
      const text = (await Clipboard.getString())?.trim() ?? "";
      setClipboardValue(isPlausibleRecipientCandidate(text) ? text : "");
    } catch {
      setClipboardValue("");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (enabled) {
        readClipboard();
      }
    }, [enabled, readClipboard]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active" && enabled) {
        readClipboard();
      }
    });
    return () => subscription.remove();
  }, [enabled, readClipboard]);

  const candidate = enabled ? clipboardValue : "";

  const { result, isLoading } = useAddressValidation({
    searchValue: candidate,
    currency,
    account,
    parentAccount,
    currentAccountId,
    recipientSupportsDomain,
    // One-shot clipboard read: skip the typing debounce so the banner appears as
    // soon as the bridge confirms the format, without the 300ms typing delay.
    debounceMs: 0,
  });

  const { isAddressComplete } = useRecipientSearchState({
    searchValue: candidate,
    result,
    isLoading,
    recipientSupportsDomain,
  });

  return {
    clipboardAddress: candidate && isAddressComplete ? candidate : null,
  };
}
