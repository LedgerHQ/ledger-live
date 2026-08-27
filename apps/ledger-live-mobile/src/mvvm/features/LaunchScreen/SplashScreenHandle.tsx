import React from "react";
import { StyleSheet, View } from "react-native";

export function SplashScreenHandle({ children }: SplashScreenHandleProps) {
  return <View style={styles.cover}>{children}</View>;
}

const styles = StyleSheet.create({
  cover: {
    flex: 1,
    backgroundColor: "#000000",
  },
});

export interface SplashScreenHandleProps {
  children: React.ReactNode;
}
