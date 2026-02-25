import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { EyeMedium, EyeNoneMedium } from "@ledgerhq/native-ui/assets/icons";
import { useToggleDiscreetMode } from "~/hooks/useToggleDiscreetMode";

export default function DiscreetModeButton({ size = 24 }: { size?: number }) {
  const { discreetMode, toggleDiscreetMode } = useToggleDiscreetMode();

  return (
    <TouchableOpacity onPress={toggleDiscreetMode} style={styles.root}>
      {discreetMode ? (
        <EyeNoneMedium size={size} color={"neutral.c100"} />
      ) : (
        <EyeMedium size={size} color={"neutral.c100"} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    margin: -10,
    padding: 10,
  },
});
