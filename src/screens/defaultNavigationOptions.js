// @flow

import React from "react";
import { StyleSheet } from "react-native";
import LText from "../components/LText";

type Props = {
  route: *,
  focused: boolean,
  tintColor: string,
};

const TabBarLabel = ({ route, focused, tintColor }: Props) => (
  <LText
    semiBold={!focused}
    bold={focused}
    secondary
    style={[styles.text, { color: tintColor }]}
  >
    {route.routeName}
  </LText>
);

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    textAlign: "center",
    transform: [{ translateY: -3 }],
  },
});

export default {
  tabBarLabel: TabBarLabel,
};
