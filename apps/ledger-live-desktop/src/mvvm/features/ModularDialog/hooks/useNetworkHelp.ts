import { useCallback, useEffect, useState } from "react";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { getCurrentTrackingPage, track } from "@shared/analytics";
import { MODULAR_DIALOG_STEP, type ModularDialogStep } from "../types";

export type NetworkHelp = Readonly<{
  isOpen: boolean;
  open: () => void;
  close: () => void;
}>;

/** "How to select the network?", on the network step of the receive flow only. */
export function useNetworkHelp(flow: string, step: ModularDialogStep): NetworkHelp | undefined {
  const [isOpen, setIsOpen] = useState(false);
  const isShown =
    flow === ModularDrawerLocation.RECEIVE_FLOW && step === MODULAR_DIALOG_STEP.NETWORK_SELECTION;

  useEffect(() => {
    if (!isShown) setIsOpen(false);
  }, [isShown]);

  const open = useCallback(() => {
    track("button_clicked", { button: "Learn more", flow, page: getCurrentTrackingPage() });
    setIsOpen(true);
  }, [flow]);
  const close = useCallback(() => setIsOpen(false), []);

  return isShown ? { isOpen, open, close } : undefined;
}
