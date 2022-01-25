// @flow
import React from "react";
import { StyleSheet, View, Text } from "react-native";
import Config from "react-native-config";
import { useDispatch } from "react-redux";
import { setTheme } from "../actions/settings";

const ThemeDebug = () => {
  const render = Config.DEBUG_THEME;
  const dispatch = useDispatch();
  const selectTheme = t => () => {
    dispatch(setTheme(t));
  };
  return render ? (
    <View style={styles.root}>
      <Text
        style={[styles.button, { backgroundColor: "#fff" }]}
        onPress={selectTheme("light")}
      />
      <Text
        style={[styles.button, { backgroundColor: "#182532" }]}
        onPress={selectTheme("dusk")}
      />
      <Text
        style={[styles.button, { backgroundColor: "#1C1D1F" }]}
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
    padding: 7,
    borderColor: "grey",
  },
});

export default ThemeDebug;
