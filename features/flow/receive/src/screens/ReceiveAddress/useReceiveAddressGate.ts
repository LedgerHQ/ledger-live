import { useEffect, useMemo } from "react";
import { trackPage } from "@shared/analytics";
import type { ReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import type { ReceiveGateType } from "../../types";
import {
  RECEIVE_ADDRESS_PAGE,
  trackReceiveAddressButton,
  type ReceiveAddressButton,
} from "./receiveAddressTracking";
import type { ReceiveGateView } from "./ReceiveAddressView.types";

const GATE_PAGES: Readonly<Record<ReceiveGateType, string>> = {
  onboarding: "Receive - Onboarding Required",
  activation: "Receive - Activation Required",
};

const GATE_BUTTONS: Readonly<Record<ReceiveGateType, ReceiveAddressButton>> = {
  onboarding: "onboard account",
  activation: "activate asset",
};

type Params = Readonly<{
  gateType: ReceiveGateType | undefined;
  /** `false` while something else covers the gate, such as a service incident. */
  isVisible: boolean;
  copy: ReceiveAddressCopy;
  onResolveGate?: (refreshGate: () => void) => void;
  refreshGate: () => void;
}>;

export function useReceiveAddressGate({
  gateType,
  isVisible,
  copy,
  onResolveGate,
  refreshGate,
}: Params): ReceiveGateView | undefined {
  useEffect(() => {
    if (!gateType || !isVisible) return;
    void trackPage({ category: GATE_PAGES[gateType], props: RECEIVE_ADDRESS_PAGE });
  }, [gateType, isVisible]);

  return useMemo(() => {
    if (!gateType) return undefined;
    const { title, description, actionLabel } = copy.gates[gateType];
    const action = onResolveGate && {
      label: actionLabel,
      onPress: () => {
        trackReceiveAddressButton(GATE_BUTTONS[gateType]);
        onResolveGate(refreshGate);
      },
    };
    return { type: gateType, title, description, action };
  }, [gateType, copy.gates, onResolveGate, refreshGate]);
}
