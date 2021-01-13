// @flow
import React, { useCallback } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import Eye from "../icons/Eye";
import { discreetModeSelector } from "../reducers/settings";
import { setDiscreetMode } from "../actions/settings";
import EyeCrossed from "../icons/EyeCrossed";

export default function DiscreetModeButton() {
  const { colors } = useTheme();
  const discreetMode = useSelector(discreetModeSelector);
  const dispatch = useDispatch();
  const onPress = useCallback(() => {
    dispatch(setDiscreetMode(!discreetMode));
  }, [discreetMode, dispatch]);

  return (
    <TouchableOpacity onPress={onPress} style={styles.root}>
      {discreetMode ? (
        <EyeCrossed size={16} color={colors.grey} />
      ) : (
        <Eye size={16} color={colors.grey} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
});
