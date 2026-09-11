import React from "react";
import { StyleSheet, View } from "react-native";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { SponsoredRentSignatureScreen } from "../screens/SponsoredRentSignature/SponsoredRentSignatureScreen";
import { SponsoredPollingScreen } from "../screens/SponsoredPolling/SponsoredPollingScreen";
import { SponsoredFailureScreen } from "../screens/SponsoredFailure/SponsoredFailureScreen";
import { useSponsoredSend } from "../context/SponsoredSendContext";
import { useSendSignature } from "../context/SendSignatureContext";

/**
 * Phase-driven overlay host for the Tronify sponsored send steps (TX-A signing, energy delivery
 * polling, and failure/retry). Mirrors SignatureOverlayHost's absoluteFill + pointerEvents="box-none"
 * pattern: the container is transparent and never blocks touches; each child screen manages its own
 * pointer events (opaque full-screen for crafting/polling/failure, portal bottom-sheet for signing).
 *
 * TRANSFER and DONE phases return null — the existing SignatureOverlayHost takes over for TX-C.
 */
export function SponsoredFlowHost() {
  const { state, selectedFeeOptionId } = useSponsoredSend();
  const { isSigning } = useSendSignature();

  let content: React.ReactNode = null;

  switch (state.phase) {
    case SPONSORED_PHASE.IDLE:
      // craftRent() is async: Amount's onReview fires it and startSigning() together, so phase stays
      // IDLE (with isSigning already true) until CRAFT_SUCCESS lands. Show the rent-signature loader
      // during that window — otherwise both this host and SignatureOverlayHost (which suppresses TX-C
      // for IDLE+tronify) render null and the user sees a blank screen. The screen renders only its
      // "Preparing energy rental…" loader while order is null, so there is no premature device flow.
      if (isSigning && selectedFeeOptionId === "tronify") {
        content = <SponsoredRentSignatureScreen />;
        break;
      }
      return null;
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
