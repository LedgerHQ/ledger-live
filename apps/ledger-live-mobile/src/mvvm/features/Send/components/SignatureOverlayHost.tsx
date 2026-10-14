import React from "react";
import { StyleSheet, View } from "react-native";
import {
  SPONSORED_PHASE,
  type SponsoredPhase,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import { SignatureScreen } from "../screens/Signature";
import { useSendSignature } from "../context/SendSignatureContext";
import { useIsSponsoredSelected, useSponsoredSend } from "../context/SponsoredSendContext";

// Only the sponsored path leaves IDLE, so these phases hide TX-C even if the pick has since changed.
const SPONSORED_SCREEN_PHASES = new Set<SponsoredPhase>([
  SPONSORED_PHASE.RENT_SIGNING,
  SPONSORED_PHASE.POLLING,
  SPONSORED_PHASE.FAILED,
]);

export function SignatureOverlayHost() {
  const { isSigning } = useSendSignature();
  const { state } = useSponsoredSend();
  const sponsoredSelected = useIsSponsoredSelected();

  // At IDLE the sponsored pick crafts TX-A after Review, so TX-C stays hidden during the craft too.
  const isSuppressed =
    state.phase === SPONSORED_PHASE.IDLE
      ? sponsoredSelected
      : SPONSORED_SCREEN_PHASES.has(state.phase);

  if (!isSigning || isSuppressed) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <SignatureScreen />
    </View>
  );
}
