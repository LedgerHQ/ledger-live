/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import { compose } from "redux";
import { Trans } from "react-i18next";
import { NotEnoughBalance } from "@ledgerhq/errors";
import type { Account, AccountLikeArray } from "@ledgerhq/types-live";

import {
  isAccountEmpty,
  getAccountSpendableBalance,
} from "@ledgerhq/live-common/account/index";
import {
  flattenAccountsEnforceHideEmptyTokenSelector,
  accountsSelector,
} from "../../reducers/accounts";
import withEnv from "../../logic/withEnv";
import { withTheme } from "../../colors";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import AccountCard from "../../components/AccountCard";
import KeyboardView from "../../components/KeyboardView";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import { formatSearchResults } from "../../helpers/formatAccountSearchResults";
import type { SearchResult } from "../../helpers/formatAccountSearchResults";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];
const forceInset = { bottom: "always" };

type Props = {
  accounts: Account[],
  allAccounts: AccountLikeArray,
  navigation: any,
  route: { params?: { currency?: string } },
  colors: *,
};

type State = {
  error: *,
};

class SendFundsSelectAccount extends Component<Props, State> {
  state = {
    error: null,
  };

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
      />
    );
  };

  renderItem = ({ item: result }: { item: SearchResult }) => {
    const { account, match } = result;
    const balance = getAccountSpendableBalance(account);
    return (
      <View
        style={
          account.type === "Account"
            ? undefined
            : [
                styles.tokenCardStyle,
                { borderLeftColor: this.props.colors.fog },
              ]
        }
      >
        <AccountCard
          disabled={!match}
          account={account}
          style={styles.cardStyle}
          onPress={() => {
            if (balance.lte(0)) {
              this.setState({
                error: new NotEnoughBalance(),
              });
            } else {
              this.props.navigation.navigate(ScreenName.SendSelectRecipient, {
                accountId: account.id,
                parentId:
                  account.type !== "Account" ? account.parentId : undefined,
              });
            }
          }}
        />
      </View>
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
    const { allAccounts, route, colors } = this.props;
    const { params } = route;
    const initialCurrencySelected = params?.currency;
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        forceInset={forceInset}
      >
        <TrackScreen category="SendFunds" name="SelectAccount" />
        <KeyboardView style={{ flex: 1 }}>
          <View style={styles.searchContainer}>
            <FilteredSearchBar
              list={allAccounts.filter(account => !isAccountEmpty(account))}
              inputWrapperStyle={styles.padding}
              renderList={this.renderList}
              renderEmptySearch={this.renderEmptySearch}
              keys={SEARCH_KEYS}
              initialQuery={initialCurrencySelected}
            />
          </View>
        </KeyboardView>
        {this.state.error ? (
          <GenericErrorBottomModal
            error={this.state.error}
            onClose={() => this.setState({ error: null })}
          />
        ) : null}
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
  tokenCardStyle: {
    marginLeft: 26,
    paddingLeft: 7,
    borderLeftWidth: 1,
  },
  searchContainer: {
    paddingTop: 16,
    flex: 1,
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

const m: React$ComponentType<{}> = compose(
  connect(mapStateToProps),
  withEnv("HIDE_EMPTY_TOKEN_ACCOUNTS"),
  withTheme,
)(SendFundsSelectAccount);

export default m;
