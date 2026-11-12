import { useCallback, useEffect, useRef, useState } from "react";
import type { AddressVerifyHint } from "../../types";

const COPY_FEEDBACK_MS = 3000;

type UseReceiveAddressViewParams = Readonly<{
  /** The "Copied" feedback only applies to the address that was copied. */
  address: string;
  onCopy: () => Promise<boolean>;
  onClose: () => void;
  verifyHint?: AddressVerifyHint;
}>;

type UseReceiveAddressView = Readonly<{
  hasCopied: boolean;
  hint?: AddressVerifyHint;
  handleCopy: () => void;
  handleClose: () => void;
}>;

export function useReceiveAddressView({
  address,
  onCopy,
  onClose,
  verifyHint,
}: UseReceiveAddressViewParams): UseReceiveAddressView {
  const [copiedAddress, setCopiedAddress] = useState<string | undefined>(undefined);
  const hasCopied = copiedAddress === address;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    if (!(await onCopy())) return;
    setCopiedAddress(address);
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setCopiedAddress(undefined), COPY_FEEDBACK_MS);
  }, [onCopy, address]);

  const handleClose = useCallback(() => {
    if (verifyHint) {
      return;
    }
    onClose();
  }, [onClose, verifyHint]);

  return {
    hasCopied,
    hint: verifyHint,
    handleCopy,
    handleClose,
  };
}
