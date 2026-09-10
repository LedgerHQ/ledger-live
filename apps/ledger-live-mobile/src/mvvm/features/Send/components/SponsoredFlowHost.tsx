import React from "react";
import { StyleSheet, View } from "react-native";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { SponsoredRentSignatureScreen } from "../screens/SponsoredRentSignature/SponsoredRentSignatureScreen";
import { SponsoredPollingScreen } from "../screens/SponsoredPolling/SponsoredPollingScreen";
import { SponsoredFailureScreen } from "../screens/SponsoredFailure/SponsoredFailureScreen";
import { useSponsoredSend } from "../context/SponsoredSendContext";

/**
 * Phase-driven overlay host for the Tronify sponsored send steps (TX-A signing, energy delivery
 * polling, and failure/retry). Mirrors SignatureOverlayHost's absoluteFill + pointerEvents="box-none"
 * pattern: the container is transparent and never blocks touches; each child screen manages its own
 * pointer events (opaque full-screen for crafting/polling/failure, portal bottom-sheet for signing).
 *
 * TRANSFER and DONE phases return null — the existing SignatureOverlayHost takes over for TX-C.
 */
export function SponsoredFlowHost() {
  const { state } = useSponsoredSend();

  let content: React.ReactNode = null;

  switch (state.phase) {
    case SPONSORED_PHASE.IDLE:
    case SPONSORED_PHASE.TRANSFER:
    case SPONSORED_PHASE.DONE:
      return null;
    case SPONSORED_PHASE.RENT_SIGNING:
      content = <SponsoredRentSignatureScreen />;
      break;
    case SPONSORED_PHASE.POLLING:
      content = <SponsoredPollingScreen />;
      break;
    case SPONSORED_PHASE.FAILED:
      content = <SponsoredFailureScreen />;
      break;
    default:
      return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {content}
    </View>
  );
}
