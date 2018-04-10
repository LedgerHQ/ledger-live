/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import WhiteButton from "../../components/WhiteButton";

class AccountHeadMenu extends PureComponent<{
  topLevelNavigation: *,
  account: Account
}> {
  onSend = () => {
    const { account, topLevelNavigation } = this.props;
    topLevelNavigation.navigate({
      routeName: "SendFunds",
      params: {
        goBackKey: topLevelNavigation.state.key,
        accountId: account.id
      },
      key: "sendfunds"
    });
  };

  onReceive = () => {
    const { account, topLevelNavigation } = this.props;
    topLevelNavigation.navigate({
      routeName: "ReceiveFunds",
      params: {
        goBackKey: topLevelNavigation.state.key,
        accountId: account.id
      },
      key: "receivefunds"
    });
  };

  render() {
    return (
      <View style={styles.root}>
        <WhiteButton
          onPress={this.onSend}
          containerStyle={styles.button}
          title="Send"
        />
        <WhiteButton
          onPress={this.onReceive}
          containerStyle={styles.button}
          title="Receive"
        />
      </View>
    );
  }
}

export default AccountHeadMenu;

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 5
  },
  button: {
    marginHorizontal: 5,
    flex: 1
  }
});
