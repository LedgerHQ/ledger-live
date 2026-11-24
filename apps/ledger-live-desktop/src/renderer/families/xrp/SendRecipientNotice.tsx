import { useEffect } from "react";
import type { XrpFamily } from "./types";

// The generic sender banner shows the refusal (frozen or unauthorized token): this only blocks the step
const SendRecipientNotice: NonNullable<XrpFamily["SendRecipientNotice"]> = ({
  status,
  onBlockedChange,
}) => {
  const isBlocked = !!status?.errors.sender;

  useEffect(() => {
    onBlockedChange?.(isBlocked);
  }, [isBlocked, onBlockedChange]);

  useEffect(() => {
    return () => onBlockedChange?.(false);
  }, [onBlockedChange]);

  return null;
};

export default SendRecipientNotice;
