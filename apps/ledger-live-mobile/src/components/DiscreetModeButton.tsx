import React, { useCallback } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { EyeMedium, EyeNoneMedium } from "@ledgerhq/native-ui/assets/icons";
import { discreetModeSelector } from "~/reducers/settings";
import { setDiscreetMode } from "~/actions/settings";
import { track } from "~/analytics";

export default function DiscreetModeButton({ size = 24 }: { size?: number }) {
  const discreetMode = useSelector(discreetModeSelector);
  const dispatch = useDispatch();
  const onPress = useCallback(() => {
    track("button_clicked", {
      button: discreetMode ? "Unmask" : "Mask",
    });
    dispatch(setDiscreetMode(!discreetMode));
  }, [discreetMode, dispatch]);

  return (
    <TouchableOpacity onPress={onPress} style={styles.root}>
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
