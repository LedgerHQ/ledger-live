import React from "react";
import { StyleSheet, View } from "react-native";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { SponsoredRentSignatureScreen } from "../screens/SponsoredRentSignature/SponsoredRentSignatureScreen";
import { SponsoredPollingScreen } from "../screens/SponsoredPolling/SponsoredPollingScreen";
import { SponsoredFailureScreen } from "../screens/SponsoredFailure/SponsoredFailureScreen";
import { useIsSponsoredSelected, useSponsoredSend } from "../context/SponsoredSendContext";
import { useSendSignature } from "../context/SendSignatureContext";

/** TRANSFER and DONE render nothing: SignatureOverlayHost signs TX-C. Retry always leaves FAILED,
 * so the next screen mounts fresh. */
export function SponsoredFlowHost() {
  const { state } = useSponsoredSend();
  const sponsoredSelected = useIsSponsoredSelected();
  const { isSigning } = useSendSignature();

  let content: React.ReactNode;
  switch (state.phase) {
    case SPONSORED_PHASE.IDLE:
      // Review crafts TX-A from here, which moves IDLE to RENT_SIGNING.
      if (!isSigning || !sponsoredSelected) return null;
      content = <SponsoredRentSignatureScreen />;
      break;
    case SPONSORED_PHASE.RENT_SIGNING:
      // The order is committed, so a lost pick (e.g. a gasSponsorship flip) mustn't hide it.
      if (!isSigning) return null;
      content = <SponsoredRentSignatureScreen />;
      break;
    case SPONSORED_PHASE.POLLING:
      content = <SponsoredPollingScreen />;
      break;
    case SPONSORED_PHASE.FAILED:
      content = <SponsoredFailureScreen />;
      break;
    case SPONSORED_PHASE.TRANSFER:
    case SPONSORED_PHASE.DONE:
      return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {content}
    </View>
  );
}
