// @flow
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import EmptyStatePortfolio from "../Portfolio/EmptyStatePortfolio";

type Props = { navigation: * };

function NoAccounts({ navigation }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.card }]}>
      <EmptyStatePortfolio showHelp={false} navigation={navigation} />
    </View>
  );
}

export default memo<Props>(NoAccounts);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
