/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import colors from "../../colors";
import AccountHeadMenu from "./AccountHeadMenu";
import AccountsCarousel from "./AccountsCarousel";

class AccountBodyHeader extends Component<{
  accounts: Account[],
  selectedIndex: number,
  topLevelNavigation: *,
  onSelectIndex: number => void
}> {
  render() {
    const {
      accounts,
      selectedIndex,
      topLevelNavigation,
      onSelectIndex
    } = this.props;
    const account = accounts[selectedIndex];
    return (
      <View style={styles.carousel}>
        <AccountsCarousel
          accounts={accounts}
          onSelectIndex={onSelectIndex}
          selectedIndex={selectedIndex}
          topLevelNavigation={topLevelNavigation}
        />
        {account ? (
          <AccountHeadMenu
            topLevelNavigation={topLevelNavigation}
            account={account}
          />
        ) : null}
      </View>
    );
  }
}

export default AccountBodyHeader;

const styles = StyleSheet.create({
  carousel: {
    paddingTop: 20,
    backgroundColor: colors.blue
  }
});
