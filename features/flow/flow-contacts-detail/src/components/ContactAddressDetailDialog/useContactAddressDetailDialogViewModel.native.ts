import { useCallback, useEffect, useState } from "react";
import { copyToClipboard } from "@shared/clipboard";
import type { ContactAddressDetailDialogProps } from "./ContactAddressDetailDialog.types";

const COPY_FEEDBACK_MS = 3000;

type ContactAddressDetailDialogViewModelInput = Pick<
  ContactAddressDetailDialogProps,
  "isOpen" | "row" | "network" | "onShareAddress"
>;

export type ContactAddressDetailDialogViewModel = Readonly<{
  hasSelection: boolean;
  hasCopied: boolean;
  onCopy: () => Promise<void>;
  onShare: (() => void) | undefined;
}>;

export function useContactAddressDetailDialogViewModel({
  isOpen,
  row,
  network,
  onShareAddress,
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

  const onCopy = useCallback(async () => {
    if (row === undefined) {
      return;
    }

    if (!(await copyToClipboard(row.address))) return;
    setHasCopied(true);
  }, [row]);

  const onShare = useCallback(() => {
    if (row === undefined || onShareAddress === undefined) {
      return;
    }

    onShareAddress(row.address);
  }, [onShareAddress, row]);

  const hasSelection = isOpen && row !== undefined && network !== undefined;

  return {
    hasSelection,
    hasCopied,
    onCopy,
    onShare: onShareAddress === undefined ? undefined : onShare,
  };
}
