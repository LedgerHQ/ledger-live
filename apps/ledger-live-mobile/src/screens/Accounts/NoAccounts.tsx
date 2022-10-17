import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import EmptyStatePortfolio from "../Portfolio/EmptyStatePortfolio";

const NoAccounts = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.card }]}>
      <EmptyStatePortfolio showHelp={false} />
    </View>
  );
};

export default memo(NoAccounts);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
