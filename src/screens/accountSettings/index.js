/* @flow */
import React, { Component } from "react";
import { ScrollView, View, StyleSheet, Switch, Image } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/wallet-common/lib/types";

import { getAccountById } from "../../reducers/accounts";
import { updateAccount } from "../../actions/accounts";
import HeaderRightClose from "../../components/HeaderRightClose";
import SectionEntry from "../../components/SectionEntry";
import SectionTitle from "../../components/SectionTitle";
import LText from "../../components/LText";

const mapStateToProps = (state, { screenProps }) => ({
  account: getAccountById(
    state,
    screenProps.topLevelNavigation.state.params.accountId
  )
});
const mapDispatchToProps = {
  updateAccount
};

class AccountSettings extends Component<{
  account: Account,
  navigation: NavigationScreenProp<{}>,
  updateAccount: ($Shape<Account>) => *
}> {
  static navigationOptions = ({ screenProps }: *) => ({
    title: "Account settings",
    headerRight: (
      <HeaderRightClose navigation={screenProps.topLevelNavigation} />
    )
  });
  toggleArchived = (value: boolean) => {
    const { account, updateAccount } = this.props;
    updateAccount({ archived: value, id: account.id });
  };
  render() {
    const { account, navigation } = this.props;
    return (
      <View>
        <ScrollView style={styles.container} />
        <SectionTitle title="ACCOUNT" />
        <SectionEntry
          onPress={() => navigation.navigate("EditName", { account })}
        >
          <LText>Name</LText>
          <LText style={styles.tempLineHeight}>
            {account.name}
            <Image source={require("../../images/arrow_right.png")} />
          </LText>
        </SectionEntry>
        <SectionEntry>
          <LText>Archive</LText>
          <Switch
            value={account.archived}
            onValueChange={this.toggleArchived}
          />
        </SectionEntry>
        <SectionTitle title="DISPLAY" />
        <SectionEntry
          onPress={() => navigation.navigate("EditUnits", { account })}
        >
          <LText>Units</LText>
          <LText style={styles.tempLineHeight}>
            {account.unit.name}
            <Image source={require("../../images/arrow_right.png")} />
          </LText>
        </SectionEntry>
        <SectionEntry />
        <SectionTitle title="COIN" />
        <SectionEntry
          onPress={() => navigation.navigate("EditConfirmations", { account })}
        >
          <LText>Required Confirmations</LText>
          <LText style={styles.tempLineHeight}>
            {account.minConfirmations}
            <Image source={require("../../images/arrow_right.png")} />
          </LText>
        </SectionEntry>
        <SectionEntry />
      </View>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountSettings);

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
  },
  tempLineHeight: {
    lineHeight: 30
  },
  image: {
    tintColor: "#fff",
    width: 28,
    height: 28
  }
});
