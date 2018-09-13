// @flow

import React, { Component, Fragment } from "react";
import { StyleSheet, FlatList } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { accountsSelector } from "../../reducers/accounts";
import AccountsIcon from "../../images/icons/Accounts";
import provideSyncRefreshControl from "../../components/provideSyncRefreshControl";
import RefreshAccountsOrdering from "../../components/RefreshAccountOrdering";
import StyledStatusBar from "../../components/StyledStatusBar";
import colors from "../../colors";

import NoAccounts from "./NoAccounts";
import AccountCard from "./AccountCard";
import AccountOrder from "./AccountOrder";
import AddAccount from "./AddAccount";

const List = provideSyncRefreshControl(FlatList);

const navigationOptions = {
  title: "Accounts",
  headerLeft: <AccountOrder />,
  headerRight: <AddAccount />,
  tabBarIcon: ({ tintColor }: { tintColor: string }) => (
    <AccountsIcon size={18} color={tintColor} />
  ),
};

const mapStateToProps = createStructuredSelector({
  accounts: accountsSelector,
});

type Props = {
  navigation: *,
  accounts: Account[],
};
class Accounts extends Component<Props> {
  static navigationOptions = navigationOptions;

  onAddMockAccount = () => {};

  renderItem = ({ item }: { item: Account }) => (
    <AccountCard navigation={this.props.navigation} account={item} />
  );

  keyExtractor = item => item.id;

  render() {
    const { accounts } = this.props;

    if (accounts.length === 0) {
      return <NoAccounts />;
    }

    return (
      <Fragment>
        <StyledStatusBar backgroundColor={colors.white} />
        <RefreshAccountsOrdering onMount />
        <List
          data={accounts}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
          style={styles.list}
          contentContainerStyle={styles.contentContainer}
        />
      </Fragment>
    );
  }
}

export default connect(mapStateToProps)(Accounts);

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
  },
});
