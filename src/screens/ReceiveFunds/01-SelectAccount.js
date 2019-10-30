/* @flow */
import React, { useCallback } from "react";
import i18next from "i18next";
import { View, StyleSheet } from "react-native";
import { createStructuredSelector } from "reselect";
// $FlowFixMe
import { SafeAreaView, FlatList } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate, Trans } from "react-i18next";
import type {
  Account,
  AccountLikeArray,
} from "@ledgerhq/live-common/lib/types";
import {
  accountsSelector,
  flattenAccountsSelector,
} from "../../reducers/accounts";
import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import LText from "../../components/LText";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import AccountCard from "../../components/AccountCard";
import StepHeader from "../../components/StepHeader";
import KeyboardView from "../../components/KeyboardView";
import { formatSearchResults } from "../../helpers/formatAccountSearchResults";
import type { SearchResult } from "../../helpers/formatAccountSearchResults";

const SEARCH_KEYS = ["name", "unit.code", "token.name", "token.ticker"];
const forceInset = { bottom: "always" };

type Navigation = NavigationScreenProp<{ params: {} }>;

type Props = {
  accounts: Account[],
  allAccounts: AccountLikeArray,
  navigation: Navigation,
};

// type State = {};

const ReceiveFunds = ({ accounts, allAccounts, navigation }: Props) => {
  const keyExtractor = item => item.account.id;

  const renderItem = useCallback(
    ({ item: result }: { item: SearchResult }) => {
      const { account } = result;
      return (
        <View
          style={account.type === "Account" ? undefined : styles.tokenCardStyle}
        >
          <AccountCard
            disabled={!result.match}
            account={account}
            style={styles.card}
            onPress={() => {
              navigation.navigate("ReceiveConnectDevice", {
                accountId: account.id,
                parentId:
                  account.type === "TokenAccount"
                    ? account.parentId
                    : undefined,
              });
            }}
          />
        </View>
      );
    },
    [navigation],
  );

  const renderList = useCallback(
    items => {
      const formatedList = formatSearchResults(items, accounts);

      return (
        <FlatList
          data={formatedList}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        />
      );
    },
    [accounts, renderItem],
  );

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <TrackScreen category="ReceiveFunds" name="SelectAccount" />
      <KeyboardView style={{ flex: 1 }}>
        <View style={styles.searchContainer}>
          <FilteredSearchBar
            keys={SEARCH_KEYS}
            inputWrapperStyle={styles.card}
            list={allAccounts}
            renderList={renderList}
            renderEmptySearch={() => (
              <View style={styles.emptyResults}>
                <LText style={styles.emptyText}>
                  <Trans i18nKey="transfer.receive.noAccount" />
                </LText>
              </View>
            )}
          />
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
};

ReceiveFunds.navigationOptions = {
  headerTitle: (
    <StepHeader
      title={i18next.t("transfer.receive.headerTitle")}
      subtitle={i18next.t("send.stepperHeader.stepRange", {
        currentStep: "1",
        totalSteps: "3",
      })}
    />
  ),
};

const mapStateToProps = createStructuredSelector({
  allAccounts: flattenAccountsSelector,
  accounts: accountsSelector,
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  tokenCardStyle: {
    marginLeft: 26,
    paddingLeft: 7,
    borderLeftWidth: 1,
    borderLeftColor: colors.fog,
  },
  card: {
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  searchContainer: {
    paddingTop: 18,
    flex: 1,
  },
  list: {
    paddingTop: 8,
  },
  emptyResults: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.fog,
  },
});

export default compose(
  connect(mapStateToProps),
  translate(),
)(ReceiveFunds);
