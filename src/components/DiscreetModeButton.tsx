import React, { useCallback } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { EyeMedium, EyeNoneMedium } from "@ledgerhq/native-ui/assets/icons";
import { discreetModeSelector } from "../reducers/settings";
import { setDiscreetMode } from "../actions/settings";

export default function DiscreetModeButton({ size = 24 }: { size?: number }) {
  const discreetMode = useSelector(discreetModeSelector);
  const dispatch = useDispatch();
  const onPress = useCallback(() => {
    dispatch(setDiscreetMode(!discreetMode));
  }, [discreetMode, dispatch]);

  return (
    <TouchableOpacity onPress={onPress} style={styles.root}>
      {discreetMode ? (
        <EyeNoneMedium size={size} color={"neutral.c70"} />
      ) : (
        <EyeMedium size={size} color={"neutral.c70"} />
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
