import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, Pressable, StyleSheet } from "react-native";

import "../state/register";
import SwapHome from "../screens/SwapHome";
import SwapDetail from "../screens/SwapDetail";
import type { SwapMfeParamList } from "./types";

const Stack = createNativeStackNavigator<SwapMfeParamList>();

const SwapNavigator: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="SwapHome"
      component={SwapHome}
      options={({ navigation }) => ({
        title: "Swap",
        headerLeft: () => (
          <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        ),
      })}
    />
    <Stack.Screen name="SwapDetail" component={SwapDetail} options={{ title: "Swap detail" }} />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  back: {
    fontSize: 16,
    color: "#2E7D32",
  },
});

export default SwapNavigator;
