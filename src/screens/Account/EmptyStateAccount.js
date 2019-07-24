/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { View, Image, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import colors from "../../colors";
import LText from "../../components/LText";
import Button from "../../components/Button";
import Receive from "../../icons/Receive";

class EmptyStateAccount extends PureComponent<{
  account: Account | TokenAccount,
  parentAccount: ?Account,
  navigation: NavigationScreenProp<*>,
}> {
  goToReceiveFunds = () => {
    const { navigation, account, parentAccount } = this.props;
    navigation.navigate("ReceiveConnectDevice", {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
    });
  };

  render() {
    const { account, parentAccount } = this.props;
    const mainAccount = getMainAccount(account, parentAccount);
    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <Image source={require("../../images/EmptyStateAccount.png")} />
          <LText secondary semiBold style={styles.title}>
            <Trans i18nKey="account.emptyState.title" />
          </LText>
          <LText style={styles.desc}>
            <Trans i18nKey="common:account.emptyState.desc">
              {"Make sure the"}
              <LText semiBold style={styles.managerAppName}>
                {mainAccount.currency.managerAppName}
              </LText>
              {"app is installed and start receiving"}
            </Trans>
          </LText>
          <Button
            event="AccountEmptyStateReceive"
            type="primary"
            title={<Trans i18nKey="account.emptyState.buttons.receiveFunds" />}
            onPress={this.goToReceiveFunds}
            containerStyle={styles.receiveButton}
            IconLeft={Receive}
          />
        </View>
      </View>
    );
  }
}

export default EmptyStateAccount;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    margin: 16,
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: colors.lightGrey,
  },
  body: {
    alignItems: "center",
  },
  receiveButton: {
    width: 290,
  },
  title: {
    marginTop: 32,
    marginBottom: 16,
    fontSize: 16,
  },
  desc: {
    color: colors.grey,
    marginHorizontal: 24,
    textAlign: "center",
    marginBottom: 32,
  },
  managerAppName: {
    color: colors.black,
  },
});
