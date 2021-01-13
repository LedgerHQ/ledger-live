/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import { compose } from "redux";
import { Trans } from "react-i18next";
import type {
  Account,
  AccountLikeArray,
} from "@ledgerhq/live-common/lib/types";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import {
  flattenAccountsEnforceHideEmptyTokenSelector,
  accountsSelector,
} from "../../reducers/accounts";
import withEnv from "../../logic/withEnv";
import { withTheme } from "../../colors";
import { ScreenName, NavigatorName } from "../../const";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import AccountCard from "../../components/AccountCard";
import KeyboardView from "../../components/KeyboardView";
import PlusIcon from "../../icons/Plus";
import { formatSearchResults } from "../../helpers/formatAccountSearchResults";
import type { SearchResult } from "../../helpers/formatAccountSearchResults";
import { connect as WCconnect } from "./Provider";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];
const forceInset = { bottom: "always" };

type Props = {
  accounts: Account[],
  allAccounts: AccountLikeArray,
  navigation: any,
  route: { params: { uri: string } },
  colors: *,
};

type State = {};

class SendFundsSelectAccount extends Component<Props, State> {
  renderList = items => {
    const { accounts } = this.props;
    const formatedList = formatSearchResults(items, accounts);

    return (
      <FlatList
        data={formatedList}
        renderItem={this.renderItem}
        keyExtractor={this.keyExtractor}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        ListFooterComponent={this.renderFooter}
      />
    );
  };

  renderFooter = () => {
    const { colors } = this.props;
    return (
      <View style={styles.footerContainer}>
        <PlusIcon size={16} color={colors.live} />
        <TouchableOpacity
          onPress={() => {
            this.props.navigation.navigate(NavigatorName.AddAccounts, {
              currency: getCryptoCurrencyById("ethereum"),
            });
          }}
        >
          <LText semiBold style={styles.addAccount} color="live">
            <Trans i18nKey={"walletconnect.addAccount"} />
          </LText>
        </TouchableOpacity>
      </View>
    );
  };

  renderItem = ({ item: result }: { item: SearchResult }) => {
    const { account, match } = result;
    return (
      <AccountCard
        disabled={!match}
        account={account}
        style={styles.cardStyle}
        onPress={() => {
          WCconnect(this.props.route.params.uri);
          this.props.navigation.replace(ScreenName.WalletConnectConnect, {
            accountId: account.id,
            uri: this.props.route.params.uri,
          });
        }}
      />
    );
  };

  renderEmptySearch = () => (
    <View style={styles.emptyResults}>
      <LText style={styles.emptyText} color="fog">
        <Trans i18nKey="transfer.receive.noAccount" />
      </LText>
    </View>
  );

  keyExtractor = item => item.account.id;

  render() {
    const { allAccounts, colors } = this.props;
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.white }]}
        forceInset={forceInset}
      >
        <TrackScreen category="WalletConnect" name="DeeplinkingSelectAccount" />
        <KeyboardView style={{ flex: 1 }}>
          <View style={styles.searchContainer}>
            <FilteredSearchBar
              list={allAccounts.filter(
                account =>
                  account.type === "Account" &&
                  getAccountCurrency(account).id === "ethereum",
              )}
              inputWrapperStyle={styles.padding}
              renderList={this.renderList}
              renderEmptySearch={this.renderEmptySearch}
              keys={SEARCH_KEYS}
            />
          </View>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  allAccounts: flattenAccountsEnforceHideEmptyTokenSelector,
  accounts: accountsSelector,
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  searchContainer: {
    paddingTop: 16,
    flex: 1,
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  addAccount: {
    marginLeft: 8,
  },
  list: {
    paddingBottom: 32,
  },
  emptyResults: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  padding: {
    paddingHorizontal: 16,
  },
  cardStyle: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
});

export default compose(
  // $FlowFixMe
  connect(mapStateToProps),
  withEnv("HIDE_EMPTY_TOKEN_ACCOUNTS"),
  withTheme,
)(SendFundsSelectAccount);
