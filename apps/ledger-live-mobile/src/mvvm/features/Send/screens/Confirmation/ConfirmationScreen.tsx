import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useSendFlowNavigation } from "../../hooks/useSendFlowNavigation";
import { SendHeader } from "../../components/SendHeader";
import { SafeAreaView } from "react-native-safe-area-context";

export const ConfirmationScreen = () => {
  const { navigation } = useSendFlowNavigation();

  const handleNextStep = () => {
    navigation.goToNextStep();
  };

  return (
    <SafeAreaView style={styles.container}>
      <SendHeader />
      <View style={styles.content}>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <Text style={styles.title}>Confirmation Screen</Text>
        <TouchableOpacity style={styles.button} onPress={handleNextStep}>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <Text style={styles.buttonText}>Next Step</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: "white",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
