// @flow

import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import type { CompoundAccountSummary } from "@ledgerhq/live-common/lib/compound/types";
import Row from "./ActiveAccountRow";
import colors from "../../../colors";
import EmptyState from "./EmptyState";

type Props = {
  summaries: CompoundAccountSummary[],
};

const ActiveAccounts = ({ summaries }: Props) => (
  <View style={styles.root}>
    <FlatList
      data={summaries}
      renderItem={({ item }) => <Row item={item} />}
      keyExtractor={(item, index) => item.account.id + index}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={() => <EmptyState />}
    />
  </View>
);

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.white,
    borderRadius: 4,
    marginBottom: 16,
  },
  separator: {
    width: "100%",
    height: 1,
    backgroundColor: colors.lightGrey,
  },
});

export default ActiveAccounts;
