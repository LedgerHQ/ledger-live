import { useCallback, useEffect, useState } from "react";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { track } from "@shared/analytics";
import { useSelector } from "~/context/hooks";
import { modularDrawerFlowSelector, modularDrawerStepSelector } from "~/reducers/modularDrawer";
import { MODULAR_DRAWER_PAGE_NAME } from "../analytics";
import { ModularDrawerStep } from "../types";

export type NetworkHelp = Readonly<{
  isOpen: boolean;
  open: () => void;
  close: () => void;
}>;

/** "How to select the network?", on the network step of the receive flow only. */
export function useNetworkHelp(): NetworkHelp | undefined {
  const flow = useSelector(modularDrawerFlowSelector);
  const step = useSelector(modularDrawerStepSelector);
  const [isOpen, setIsOpen] = useState(false);
  const isShown = flow === ModularDrawerLocation.RECEIVE_FLOW && step === ModularDrawerStep.Network;

  useEffect(() => {
    if (!isShown) setIsOpen(false);
  }, [isShown]);

  const open = useCallback(() => {
    track("button_clicked", {
      button: "Learn more",
      flow,
      page: MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION,
    });
    setIsOpen(true);
  }, [flow]);
  const close = useCallback(() => setIsOpen(false), []);

  return isShown ? { isOpen, open, close } : undefined;
}
