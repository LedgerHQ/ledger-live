/* @flow */
import React, { Component } from "react";
import { FlatList, StyleSheet } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/wallet-common/lib/types";

import { getVisibleAccounts } from "../reducers/accounts";
import AccountChoice from "../components/AccountChoice";

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  list: {
    paddingVertical: 20
  }
});

const mapPropsToState = state => ({
  accounts: getVisibleAccounts(state)
});

class ReceiveFundsSelectAccount extends Component<{
  accounts: Account[],
  navigation: NavigationScreenProp<{
    params: {
      selectedAccountId: string,
      setSelectedAccount: (string, string) => void
    }
  }>
}> {
  static navigationOptions = {
    title: "Select an account"
  };

  onAccountPress = (account: Account) => {
    const { navigation } = this.props;
    const { selectedAccountId, setSelectedAccount } = navigation.state.params;
    if (selectedAccountId !== account.id)
      setSelectedAccount(account.id, account.unit.code);
    navigation.goBack();
  };

  renderItem = ({ item }: { item: Account }) => (
    <AccountChoice account={item} onPress={this.onAccountPress} />
  );

  keyExtractor = (item: Account) => item.id;

  render() {
    const { accounts } = this.props;
    return (
      <FlatList
        style={styles.root}
        contentContainerStyle={styles.list}
        data={accounts}
        renderItem={this.renderItem}
        keyExtractor={this.keyExtractor}
      />
    );
  }
}

export default connect(mapPropsToState)(ReceiveFundsSelectAccount);
