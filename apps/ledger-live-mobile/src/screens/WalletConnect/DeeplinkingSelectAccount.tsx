import React, { Component } from "react";
import { connect } from "react-redux";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ListRenderItemInfo,
  ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { compose } from "redux";
import { Trans } from "react-i18next";
import type { Account, AccountLike, AccountLikeArray } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { createStructuredSelector } from "reselect";
import { CompositeScreenProps } from "@react-navigation/native";
import withEnv from "../../logic/withEnv";
import { withTheme } from "../../colors";
import type { Theme } from "../../colors";
import type { State as StoreState } from "../../reducers/types";
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
import {
  accountsCountSelector,
  flattenAccountsEnforceHideEmptyTokenSelector,
} from "../../reducers/accounts";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { WalletConnectNavigatorParamList } from "../../components/RootNavigator/types/WalletConnectNavigator";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];
type Navigation = CompositeScreenProps<
  StackNavigatorProps<
    WalletConnectNavigatorParamList,
    ScreenName.WalletConnectDeeplinkingSelectAccount
  >,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;
type Props = {
  accounts: Account[];
  allAccounts: AccountLikeArray;
  colors: Theme["colors"];
} & Navigation;

class SendFundsSelectAccount extends Component<Props> {
  renderList = (items: AccountLike[]) => {
    const { accounts } = this.props;
    const formatedList = formatSearchResults(items, accounts);
    return (
      <FlatList
        data={formatedList}
        renderItem={
          this.renderItem as ListRenderItem<
            | SearchResult
            | (AccountLike & {
                match: boolean;
              })
          >
        }
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
            // FIXME: OSKOUR AGAIN
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
  renderItem = ({ item: result }: ListRenderItemInfo<SearchResult>) => {
    const { account, match } = result;
    return (
      <AccountCard
        disabled={!match}
        account={account}
        style={styles.cardStyle}
        onPress={() => {
          WCconnect(this.props.route.params?.uri || "");

          this.props.navigation.replace(NavigatorName.WalletConnect, {
            screen: ScreenName.WalletConnectConnect,
            params: {
              accountId: account.id,
              uri: this.props.route.params.uri,
            },
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
  keyExtractor = (item: SearchResult) => item.account.id;

  render() {
    const { allAccounts, colors } = this.props;
    return (
      <SafeAreaView
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <TrackScreen category="WalletConnect" name="DeeplinkingSelectAccount" />
        <KeyboardView
          style={{
            flex: 1,
          }}
        >
          <View style={styles.searchContainer}>
            <FilteredSearchBar
              list={allAccounts.filter(
                account =>
                  account.type === "Account" &&
                  ["ethereum", "bsc", "polygon"].includes(getAccountCurrency(account).id),
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

const mapStateToProps = createStructuredSelector<
  StoreState,
  {
    allAccounts: AccountLike[];
    accounts: number;
  }
>({
  allAccounts: flattenAccountsEnforceHideEmptyTokenSelector,
  accounts: accountsCountSelector,
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

const m = compose<React.ComponentType<Navigation>>(
  connect(mapStateToProps),
  withEnv("HIDE_EMPTY_TOKEN_ACCOUNTS"),
  withTheme,
)(SendFundsSelectAccount);

export default m;
