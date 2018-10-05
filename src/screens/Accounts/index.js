// @flow

import React, { Component, Fragment } from "react";
import { StyleSheet, FlatList } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { accountsSelector } from "../../reducers/accounts";
import AccountsIcon from "../../icons/Accounts";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";

import NoAccounts from "./NoAccounts";
import AccountRow from "./AccountRow";
import AccountOrder from "./AccountOrder";
import AddAccount from "./AddAccount";

const List = globalSyncRefreshControl(FlatList);

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
    <AccountRow
      navigation={this.props.navigation}
      account={item}
      accountId={item.id}
    />
  );

  keyExtractor = item => item.id;

  initiallyHadNoAccounts = this.props.accounts.length === 0;

  render() {
    const { accounts } = this.props;

    if (accounts.length === 0) {
      return <NoAccounts />;
    }

    return (
      <Fragment>
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 64,
  },
});
