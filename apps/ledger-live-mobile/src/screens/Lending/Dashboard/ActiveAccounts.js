// @flow

import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import type { CompoundAccountSummary } from "@ledgerhq/live-common/lib/compound/types";
import { useTheme } from "@react-navigation/native";
import Row from "./ActiveAccountRow";
import EmptyState from "./EmptyState";

type Props = {
  summaries: CompoundAccountSummary[],
};

const ActiveAccounts = ({ summaries }: Props) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={summaries}
        renderItem={({ item }) => <Row item={item} />}
        keyExtractor={(item, index) => item.account.id + index}
        ItemSeparatorComponent={() => (
          <View
            style={[styles.separator, { backgroundColor: colors.background }]}
          />
        )}
        ListEmptyComponent={() => <EmptyState />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    borderRadius: 4,
    marginBottom: 16,
  },
  separator: {
    width: "100%",
    height: 1,
  },
});

export default ActiveAccounts;
