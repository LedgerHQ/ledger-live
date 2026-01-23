import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { useSendFlowNavigation } from "../hooks/useSendFlowNavigation";
import { useSendFlowActions } from "../context/SendFlowContext";
import ArrowLeft from "~/icons/ArrowLeft";
import Close from "~/icons/Close";

export function SendHeader() {
  const { navigation, currentStepConfig } = useSendFlowNavigation();
  const { close } = useSendFlowActions();

  const canGoBack = currentStepConfig?.canGoBack === true && navigation.canGoBack();

  const handleBackPress = () => {
    if (canGoBack) {
      navigation.goToPreviousStep();
    }
  };

  const handleClose = () => {
    close();
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={[styles.iconButton, !canGoBack && styles.hidden]}
        onPress={handleBackPress}
        disabled={!canGoBack}
      >
        <ArrowLeft size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>{"Send Header"}</Text>
      </View>

      <TouchableOpacity style={styles.iconButton} onPress={handleClose}>
        <Close size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    // backgroundColor: "red",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  hidden: {
    opacity: 0,
    pointerEvents: "none",
  },
  content: {
    flex: 1,
  },
  title: {
    textAlign: "center",
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
