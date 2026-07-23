import React from "react";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { View, Text, StyleSheet } from "react-native";

import { swapStateSelector } from "../state/swapSlice";
import type { SwapMfeParamList } from "../navigation/types";

const SwapDetail: React.FC = () => {
  const route = useRoute<RouteProp<SwapMfeParamList, "SwapDetail">>();
  const { clickCount } = useSelector(swapStateSelector);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detail for {route.params.id}</Text>
      <Text style={styles.subtitle}>shared clicks={clickCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#E3F2FD",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1565C0",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#1976D2",
  },
});

export default SwapDetail;
