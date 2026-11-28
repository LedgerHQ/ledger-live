import { useState } from "react";

export type UpdateScreenReturnInput = Readonly<{
  /** How many times the user came back from the update screen without updating. */
  returnsWithoutUpdate: number;
  recheckingUpdate: boolean;
}>;

/**
 * True from the moment the user leaves the update screen without updating until the update is
 * offered again and answered, so the next offer opens on the skip confirmation.
 */
export function useConfirmSkipAfterUpdateScreen({
  returnsWithoutUpdate,
  recheckingUpdate,
}: UpdateScreenReturnInput): boolean {
  const [seenReturns, setSeenReturns] = useState(returnsWithoutUpdate);
  const [wasRechecking, setWasRechecking] = useState(recheckingUpdate);
  const [confirmSkip, setConfirmSkip] = useState(false);

  if (seenReturns !== returnsWithoutUpdate) {
    setSeenReturns(returnsWithoutUpdate);
    setConfirmSkip(true);
  }
  if (wasRechecking !== recheckingUpdate) {
    setWasRechecking(recheckingUpdate);
    if (wasRechecking && confirmSkip) setConfirmSkip(false);
  }

  return confirmSkip;
}
