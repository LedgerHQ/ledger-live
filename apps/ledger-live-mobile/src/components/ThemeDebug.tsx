import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { useDispatch } from "react-redux";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";

import { setTheme } from "../actions/settings";
import { Theme } from "../reducers/types";

const ThemeDebug = () => {
  const render = useEnv("DEBUG_THEME");
  const dispatch = useDispatch();

  const selectTheme = (t: Theme) => () => {
    dispatch(setTheme(t));
  };

  return render ? (
    <View style={styles.root}>
      <Text
        style={[
          styles.button,
          {
            backgroundColor: "#fff",
          },
        ]}
        onPress={selectTheme("light")}
      />
      <Text
        style={[
          styles.button,
          {
            backgroundColor: "#1C1D1F",
          },
        ]}
        onPress={selectTheme("dark")}
      />
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  root: {
    zIndex: 999,
    flex: 1,
    position: "absolute",
    top: 50,
    left: 0,
  },
  button: {
    borderWidth: 1,
    padding: 10,
    borderColor: "black",
  },
});
export default ThemeDebug;
