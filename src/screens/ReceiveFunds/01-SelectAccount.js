/* @flow */
import React, { Component } from "react";
import i18next from "i18next";
import { View, StyleSheet } from "react-native";
import { createStructuredSelector } from "reselect";
// $FlowFixMe
import { SafeAreaView, FlatList } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate, Trans } from "react-i18next";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
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

const SEARCH_KEYS = ["name", "unit.code"];

type Navigation = NavigationScreenProp<{ params: {} }>;

type Props = {
  accounts: Account[],
  allAccounts: (Account | TokenAccount)[],
  navigation: Navigation,
};

type State = {};

class ReceiveFunds extends Component<Props, State> {
  static navigationOptions = {
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

  renderItem = ({ item: account }: { item: Account | TokenAccount }) => {
    const { accounts } = this.props;
    const parentAccount =
      account.type === "TokenAccount"
        ? accounts.find(a => a.id === account.parentId)
        : null;

    return (
      <AccountCard
        account={account}
        parentAccount={parentAccount}
        style={styles.card}
        onPress={() => {
          this.props.navigation.navigate("ReceiveConnectDevice", {
            accountId: account.id,
            parentId: parentAccount && parentAccount.id,
          });
        }}
      />
    );
  };

  keyExtractor = item => item.id;

  render() {
    const { allAccounts } = this.props;
    return (
      <SafeAreaView style={styles.root}>
        <TrackScreen category="ReceiveFunds" name="SelectAccount" />
        <KeyboardView style={{ flex: 1 }}>
          <View style={styles.searchContainer}>
            <FilteredSearchBar
              keys={SEARCH_KEYS}
              inputWrapperStyle={styles.card}
              list={allAccounts}
              renderList={items => (
                <FlatList
                  data={items}
                  renderItem={this.renderItem}
                  keyExtractor={this.keyExtractor}
                  showsVerticalScrollIndicator={false}
                  keyboardDismissMode="on-drag"
                />
              )}
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
  }
}

const mapStateToProps = createStructuredSelector({
  allAccounts: flattenAccountsSelector,
  accounts: accountsSelector,
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
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
