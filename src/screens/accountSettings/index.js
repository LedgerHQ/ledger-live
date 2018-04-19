/* @flow */
import React, { Component } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import { accountByIdSelector } from "../../reducers/accounts";
import HeaderRightClose from "../../components/HeaderRightClose";
import SettingsRow from "../../components/SettingsRow";
import SectionTitle from "../../components/SectionTitle";
import LText from "../../components/LText";
import ArchiveToggle from "./ArchiveToggle";
import CurrencySettingsSection from "../CurrenciesSettings/Section";

const mapStateToProps = (state, { screenProps }) => ({
  account: accountByIdSelector(
    state,
    screenProps.topLevelNavigation.state.params.accountId
  )
});

class AccountSettings extends Component<{
  account: Account,
  navigation: NavigationScreenProp<*>
}> {
  static navigationOptions = ({ screenProps }: *) => ({
    title: "Account settings",
    headerRight: (
      <HeaderRightClose navigation={screenProps.topLevelNavigation} />
    )
  });
  render() {
    const { account, navigation } = this.props;
    const accountId = account.id;
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <SectionTitle title="ACCOUNT" />
        <SettingsRow
          title="Name"
          arrowRight
          onPress={() =>
            // $FlowFixMe https://github.com/react-navigation/react-navigation/pull/3843
            navigation.navigate({
              routeName: "EditName",
              params: { accountId },
              key: "editname"
            })
          }
        >
          <LText>{account.name}</LText>
        </SettingsRow>
        <SettingsRow title="Archive">
          <ArchiveToggle accountId={accountId} />
        </SettingsRow>
        <SectionTitle title="DISPLAY" />
        <SettingsRow
          title="Units"
          onPress={() =>
            // $FlowFixMe https://github.com/react-navigation/react-navigation/pull/3843
            navigation.navigate({
              routeName: "EditUnits",
              params: { accountId },
              key: "editunits"
            })
          }
        >
          <LText>
            {account.unit.name} ({account.unit.code})
          </LText>
        </SettingsRow>
        <CurrencySettingsSection
          navigation={navigation}
          currency={account.currency}
        />
      </ScrollView>
    );
  }
}

export default connect(mapStateToProps)(AccountSettings);

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  container: { flex: 1 },
  header: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },
  headerText: {
    color: "white",
    fontSize: 16
  }
});
