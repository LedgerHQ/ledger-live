import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { View, Text, StyleSheet, Switch, Pressable } from "react-native";

import "./state/register";
import { recordSwapClick, swapStateSelector } from "./state/swapSlice";

interface HelloWorldImplProps {
  name?: string;
}

const HelloWorldImpl: React.FC<HelloWorldImplProps> = ({ name = "World" }) => {
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

export default HelloWorldImpl;
