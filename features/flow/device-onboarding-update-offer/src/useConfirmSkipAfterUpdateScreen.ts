import { useState } from "react";

export type UpdateScreenReturnInput = Readonly<{
  updateScreenOpen: boolean;
  recheckingUpdate: boolean;
}>;

/**
 * True from the moment the user leaves the update screen without updating until the update is
 * offered again and answered, so the next offer opens on the skip confirmation.
 */
export function useConfirmSkipAfterUpdateScreen({
  updateScreenOpen,
  recheckingUpdate,
}: UpdateScreenReturnInput): boolean {
  const [wasOpen, setWasOpen] = useState(updateScreenOpen);
  const [confirmSkip, setConfirmSkip] = useState(false);

  if (wasOpen !== updateScreenOpen) {
    setWasOpen(updateScreenOpen);
    if (wasOpen && recheckingUpdate) setConfirmSkip(true);
  }
  if (confirmSkip && !recheckingUpdate) setConfirmSkip(false);

  return confirmSkip;
}
