// @flow
import React, { Component } from "react";
import { View, StyleSheet, Image, FlatList } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { Account } from "@ledgerhq/live-common/lib/types";
import LText from "../../components/LText";
import { accountsSelector } from "../../reducers/accounts";
import GenerateMockAccountsButton from "../../components/GenerateMockAccountsButton";
import BlueButton from "../../components/BlueButton";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import CounterValue from "../../components/CounterValue";
import CurrencyIcon from "../../components/CurrencyIcon";

const navigationOptions = {
  tabBarIcon: ({ tintColor }: { tintColor: string }) => (
    <Image
      source={require("../../images/accounts.png")}
      style={{ tintColor, width: 32, height: 32 }}
    />
  )
};

const mapStateToProps = createStructuredSelector({
  accounts: accountsSelector
});

type Props = {
  navigation: *,
  accounts: Account[]
};
class Accounts extends Component<Props> {
  static navigationOptions = navigationOptions;

  onAddMockAccount = () => {};

  renderItem = ({ item }: { item: Account }) => (
    <View style={{ flexDirection: "row", padding: 6, alignItems: "center" }}>
      <CurrencyIcon size={32} currency={item.currency} />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <View style={{ flexDirection: "row" }}>
          <LText bold>
            <CurrencyUnitValue showCode unit={item.unit} value={item.balance} />
          </LText>
          <LText style={{ marginLeft: 10 }}>
            <CounterValue
              showCode
              currency={item.currency}
              value={item.balance}
            />
          </LText>
        </View>
        <LText numberOfLines={1}>{item.name}</LText>
      </View>
      <BlueButton
        title="Settings"
        onPress={() =>
          this.props.navigation.navigate("AccountSettings", {
            accountId: item.id
          })
        }
      />
    </View>
  );

  keyExtractor = item => item.id;

  render() {
    const { accounts } = this.props;
    return (
      <View style={styles.root}>
        <View style={{ padding: 40 }}>
          <GenerateMockAccountsButton title="Generate Mock Accounts" />
        </View>
        <FlatList
          data={accounts}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
        />
      </View>
    );
  }
}

export default connect(mapStateToProps)(Accounts);

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});
