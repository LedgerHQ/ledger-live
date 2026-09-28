import { LongerPasswordView, PasswordDraftProvider } from "@features/flow-app-lock";
import React from "react";
import { StyleSheet, View } from "react-native";
import { DraftLifetime } from "./internals/DraftLifetime";
import type { LongerPasswordGateViewModel } from "./useLongerPasswordGateViewModel";

/**
 * An overlay, not a route: a route is presented in its own window, and the sheets this flow opens
 * present into the app's, so they would show through it and take none of the taps meant for them.
 *
 * The draft provider sits outside what the lock takes away, so a password chosen before the app was
 * backgrounded is still there to confirm against.
 */
export function LongerPasswordGate({
  isHolding,
  ...viewModel
}: LongerPasswordGateViewModel): React.JSX.Element {
  return (
    <PasswordDraftProvider>
      <DraftLifetime step={viewModel.step} />
      {isHolding ? (
        <View style={styles.overlay} accessibilityViewIsModal>
          <LongerPasswordView {...viewModel} />
        </View>
      ) : null}
    </PasswordDraftProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
