import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";
import { View, Text, StyleSheet, Pressable } from "react-native";

import { recordSwapClick, swapStateSelector } from "../state/swapSlice";
import type { SwapMfeParamList } from "../navigation/types";

const SwapHome: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<SwapMfeParamList, "SwapHome">>();
  const { clickCount, lastClickedAt } = useSelector(swapStateSelector);
  const dispatch = useDispatch();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello World from Swap MFE</Text>
      <Pressable
        style={styles.counter}
        onPress={() => dispatch(recordSwapClick({ at: new Date().toISOString() }))}
      >
        <Text style={styles.counterText}>
          clicks={clickCount} last={lastClickedAt ?? "-"}
        </Text>
      </Pressable>
      <Pressable
        style={styles.primary}
        onPress={() => navigation.navigate("SwapDetail", { id: "42" })}
      >
        <Text style={styles.primaryText}>Open detail</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#E8F5E9",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 24,
    textAlign: "center",
  },
  counter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#4CAF50",
    marginBottom: 16,
  },
  counterText: {
    fontSize: 16,
    color: "#558B2F",
  },
  primary: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default SwapHome;
