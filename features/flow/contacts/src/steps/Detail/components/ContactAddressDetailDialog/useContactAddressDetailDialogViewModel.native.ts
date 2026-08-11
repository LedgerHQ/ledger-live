import { useCallback, useEffect, useState } from "react";
import type { ContactAddressDetailDialogNativeProps } from "./types";

const COPY_FEEDBACK_MS = 3000;

type ContactAddressDetailDialogViewModelInput = Pick<
  ContactAddressDetailDialogNativeProps,
  "isOpen" | "row" | "network" | "onCopyAddress"
>;

export type ContactAddressDetailDialogViewModel = Readonly<{
  hasSelection: boolean;
  hasCopied: boolean;
  onCopy: () => void;
}>;

export function useContactAddressDetailDialogViewModel({
  isOpen,
  row,
  network,
  onCopyAddress,
}: ContactAddressDetailDialogViewModelInput): ContactAddressDetailDialogViewModel {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHasCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!hasCopied) {
      return;
    }

    const timeoutId = setTimeout(() => setHasCopied(false), COPY_FEEDBACK_MS);

    return () => clearTimeout(timeoutId);
  }, [hasCopied]);

  const onCopy = useCallback(() => {
    if (row === undefined || onCopyAddress === undefined) {
      return;
    }

    onCopyAddress(row.address);
    setHasCopied(true);
  }, [onCopyAddress, row]);

  const hasSelection = isOpen && row !== undefined && network !== undefined;

  return {
    hasSelection,
    hasCopied,
    onCopy,
  };
}
