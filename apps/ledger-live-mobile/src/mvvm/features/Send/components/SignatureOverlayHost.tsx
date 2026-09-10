import React from "react";
import { StyleSheet, View } from "react-native";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { SignatureScreen } from "../screens/Signature";
import { useSendSignature } from "../context/SendSignatureContext";
import { useSponsoredSend } from "../context/SponsoredSendContext";

// When the Tronify fee option is active, these phases own the device interaction exclusively.
// IDLE is included because craftRent is async — startSigning fires before CRAFT_SUCCESS lands,
// so the TX-C overlay must be suppressed during the crafting window too.
const TRONIFY_SUPPRESS_PHASES = new Set([
  SPONSORED_PHASE.IDLE,
  SPONSORED_PHASE.RENT_SIGNING,
  SPONSORED_PHASE.POLLING,
  SPONSORED_PHASE.FAILED,
]);

export function SignatureOverlayHost() {
  const { isSigning } = useSendSignature();
  const { state, selectedFeeOptionId } = useSponsoredSend();

  const isSuppressed =
    selectedFeeOptionId === "tronify" && TRONIFY_SUPPRESS_PHASES.has(state.phase);

  if (!isSigning || isSuppressed) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <SignatureScreen />
    </View>
  );
}
