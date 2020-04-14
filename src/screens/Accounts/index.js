// @flow

import React, { Component } from "react";
import { StyleSheet } from "react-native";
// $FlowFixMe
import { FlatList } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { translate } from "react-i18next";
import i18next from "i18next";
import { compose } from "redux";
import type { Account, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { accountsSelector } from "../../reducers/accounts";
import AccountsIcon from "../../icons/Accounts";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";
import TrackScreen from "../../analytics/TrackScreen";

import NoAccounts from "./NoAccounts";
import AccountRow from "./AccountRow";
import AccountOrder from "./AccountOrder";
import AddAccount from "./AddAccount";
import MigrateAccountsBanner from "../MigrateAccounts/Banner";
import BlacklistTokenModal from "../Settings/Accounts/BlacklistTokenModal";

const List = globalSyncRefreshControl(FlatList);

const navigationOptions = {
  title: i18next.t("accounts.title"),
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

type State = {
  blacklistToken?: TokenCurrency,
};

class Accounts extends Component<Props, State> {
  static navigationOptions = navigationOptions;

  state = {
    blacklistToken: undefined,
  };

  blacklistToken = blacklistToken => this.setState({ blacklistToken });
  clearBlacklistToken = () => this.setState({ blacklistToken: undefined });

  renderItem = ({ item, index }: { item: Account, index: number }) => (
    <AccountRow
      navigation={this.props.navigation}
      account={item}
      accountId={item.id}
      onBlacklistToken={this.blacklistToken}
      isLast={index === this.props.accounts.length - 1}
    />
  );

  keyExtractor = item => item.id;

  render() {
    const { accounts, navigation } = this.props;
    const { blacklistToken } = this.state;

    if (accounts.length === 0) {
      return (
        <>
          <TrackScreen category="Accounts" accountsLength={0} />
          <NoAccounts navigation={navigation} />
        </>
      );
    }

    return (
      <>
        <TrackScreen category="Accounts" accountsLength={accounts.length} />
        <List
          data={accounts}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
          style={styles.list}
          contentContainerStyle={styles.contentContainer}
        />
        <MigrateAccountsBanner />
        <BlacklistTokenModal
          onClose={this.clearBlacklistToken}
          isOpened={!!blacklistToken}
          token={blacklistToken}
        />
      </>
    );
  }
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(Accounts);

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 64,
  },
});
