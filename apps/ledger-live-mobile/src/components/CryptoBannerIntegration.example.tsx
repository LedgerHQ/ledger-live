import React from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { CryptoBanner } from "@ledgerhq/crypto-banner";

export const AppWithCryptoBanner = () => {
  return (
    <SafeAreaView style={styles.container}>
      <CryptoBanner product="llm" version="1.0.0" />

      <View style={styles.content}>{/* Rest of your application */}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
  },
});
