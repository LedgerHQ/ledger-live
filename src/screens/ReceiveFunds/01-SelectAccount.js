/* @flow */
import React, { Component } from "react";
import { View, SafeAreaView, StyleSheet, FlatList } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate, Trans } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";

import LText from "../../components/LText";
import FilteredSearchBar from "../../components/FilteredSearchBar";
import AccountCard from "../../components/AccountCard";
import Stepper from "../../components/Stepper";
import StepHeader from "../../components/StepHeader";
import KeyboardView from "../../components/KeyboardView";

import { accountsSelector } from "../../reducers/accounts";
import colors from "../../colors";

const SEARCH_KEYS = ["name", "unit.code"];

type Navigation = NavigationScreenProp<{ params: {} }>;

type Props = {
  accounts: Account[],
  navigation: Navigation,
};

type State = {};

class ReceiveFunds extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: <StepHeader title="Receive funds" subtitle="1 of 3" />,
  };

  renderItem = ({ item }: { item: Account }) => (
    <AccountCard
      account={item}
      style={styles.card}
      onPress={() => {
        this.props.navigation.navigate("ReceiveConnectDevice", {
          accountId: item.id,
        });
      }}
    />
  );

  keyExtractor = item => item.id;

  render() {
    const { accounts } = this.props;
    return (
      <SafeAreaView style={styles.root}>
        <KeyboardView style={{ flex: 1 }}>
          <Stepper nbSteps={3} currentStep={1} />
          <View style={styles.searchContainer}>
            <FilteredSearchBar
              keys={SEARCH_KEYS}
              inputWrapperStyle={styles.card}
              list={accounts}
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

const mapStateToProps = state => ({
  accounts: accountsSelector(state),
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
