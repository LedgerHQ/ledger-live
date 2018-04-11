/* @flow */
import React, { Component } from "react";
import { FlatList, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import Touchable from "../../components/Touchable";
import AccountRow from "./AccountRow";
import colors from "../../colors";

class AccountExpanded extends Component<{
  accounts: Account[],
  onPressExpandedItem: number => ?Promise<*>
}> {
  keyExtractor = (item: Account) => item.id;

  renderItemExpanded = ({ item, index }: { item: Account, index: number }) => (
    <Touchable onPress={() => this.props.onPressExpandedItem(index)}>
      <AccountRow account={item} />
    </Touchable>
  );

  render() {
    const { accounts } = this.props;
    return (
      <FlatList
        style={styles.root}
        data={accounts}
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItemExpanded}
      />
    );
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.blue,
    flex: 1
  }
});

export default AccountExpanded;
