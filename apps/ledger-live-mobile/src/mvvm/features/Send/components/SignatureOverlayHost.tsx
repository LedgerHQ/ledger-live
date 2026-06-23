import React from "react";
import { StyleSheet, View } from "react-native";
import { SignatureScreen } from "../screens/Signature";
import { useSendSignature } from "../context/SendSignatureContext";

/**
 * Hosts the signature step (the Device Intent Executor and the bottom sheet it owns) directly
 * inside the send flow container instead of a dedicated navigation modal.
 */
export function SignatureOverlayHost() {
  const { isSigning } = useSendSignature();

  if (!isSigning) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <SignatureScreen />
    </View>
  );
}
