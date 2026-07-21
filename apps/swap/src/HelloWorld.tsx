import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { View, Text, StyleSheet, Switch, Pressable } from "react-native";

import "./state/register";
import { recordSwapClick, swapStateSelector } from "./state/swapSlice";

interface HelloWorldProps {
  name?: string;
}

/**
 * Module Federation entry exposed as `swap/HelloWorld`.
 *
 * Exposed modules are loaded by the host through the federation runtime's async `get()`
 * (after `init(shareScope)`), so this module can import non-eager shared deps
 * (`react-redux`, `@reduxjs/toolkit`, `@shared/mobile-host-runtime`) directly — no lazy
 * indirection is needed. Loading state and error containment live on the host side via
 * `createRemoteComponent`. The `./state/register` side effect registers the `swap` Redux
 * slice on the host store when this module loads.
 */
const HelloWorld: React.FC<HelloWorldProps> = ({ name = "World" }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const { clickCount, lastClickedAt } = useSelector(swapStateSelector);
  const dispatch = useDispatch();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Wallet</Text>
      <Switch ios_backgroundColor="#3e3e3e" onValueChange={setIsEnabled} value={isEnabled} />
      <Pressable onPress={() => dispatch(recordSwapClick({ at: new Date().toISOString() }))}>
        <Text>
          Hello, {name}! clicks={clickCount} last={lastClickedAt ?? "-"}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
    margin: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#558B2F",
    fontStyle: "italic",
  },
});

export default HelloWorld;
