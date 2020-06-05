/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { View, Image, StyleSheet } from "react-native";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account";
import { listTokenTypesForCryptoCurrency } from "@ledgerhq/live-common/lib/currencies";
import { ScreenName, NavigatorName } from "../../const";
import colors from "../../colors";
import LText from "../../components/LText";
import Button from "../../components/Button";
import Receive from "../../icons/Receive";
import Exchange from "../../icons/Exchange";
import { isCurrencySupported } from "../Exchange/coinifyConfig";

class EmptyStateAccount extends PureComponent<{
  account: AccountLike,
  parentAccount: ?Account,
  navigation: *,
}> {
  goToReceiveFunds = () => {
    const { navigation, account, parentAccount } = this.props;
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConnectDevice,
      params: {
        accountId: account.id,
        parentId: parentAccount && parentAccount.id,
      },
    });
  };

  goToBuyCrypto = () => {
    const { navigation, account, parentAccount } = this.props;
    navigation.navigate(NavigatorName.Exchange, {
      screen: ScreenName.Exchange,
      params: {
        accountId: account.id,
        parentId: parentAccount && parentAccount.id,
      },
    });
  };

  render() {
    const { account, parentAccount } = this.props;
    const mainAccount = getMainAccount(account, parentAccount);
    const hasSubAccounts = Array.isArray(mainAccount.subAccounts);
    const isToken =
      listTokenTypesForCryptoCurrency(mainAccount.currency).length > 0;
    const canBeBought = isCurrencySupported(getAccountCurrency(account));

    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <Image source={require("../../images/EmptyStateAccount.png")} />
          <LText secondary semiBold style={styles.title}>
            <Trans i18nKey="account.emptyState.title" />
          </LText>
          <LText style={styles.desc}>
            {hasSubAccounts && isToken ? (
              <Trans i18nKey="account.emptyState.descToken">
                {"Make sure the"}
                <LText semiBold style={styles.managerAppName}>
                  {mainAccount.currency.managerAppName}
                </LText>
                {"app is installed and start receiving"}
                <LText semiBold style={styles.managerAppName}>
                  {mainAccount.currency.ticker}
                </LText>
                {"and"}
                <LText semiBold style={styles.managerAppName}>
                  {account &&
                    account.currency &&
                    listTokenTypesForCryptoCurrency(mainAccount.currency).join(
                      ", ",
                    )}
                  {"tokens"}
                </LText>
              </Trans>
            ) : canBeBought ? (
              <Trans i18nKey="account.emptyState.descWithBuy">
                {"Make sure the"}
                <LText semiBold style={styles.managerAppName}>
                  {mainAccount.currency.managerAppName}
                </LText>
                {"app is installed so you can buy or receive"}
                <LText semiBold style={styles.managerAppName}>
                  {getAccountCurrency(account).ticker}
                </LText>
              </Trans>
            ) : (
              <Trans i18nKey="account.emptyState.desc">
                {"Make sure the"}
                <LText semiBold style={styles.managerAppName}>
                  {mainAccount.currency.managerAppName}
                </LText>
                {"app is installed and start receiving"}
              </Trans>
            )}
          </LText>
          <View style={styles.buttonContainer}>
            <Button
              event="AccountEmptyStateReceive"
              type="primary"
              title={
                <Trans i18nKey="account.emptyState.buttons.receiveFunds" />
              }
              onPress={this.goToReceiveFunds}
              IconLeft={Receive}
            />
            {canBeBought ? (
              <Button
                event="Buy Crypto Empty Account Button"
                eventProperties={{
                  currencyName: getAccountCurrency(account).name,
                }}
                type="primary"
                title={<Trans i18nKey="account.emptyState.buttons.buyCrypto" />}
                onPress={this.goToBuyCrypto}
                containerStyle={styles.buyButton}
                IconLeft={Exchange}
              />
            ) : null}
          </View>
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
  buyButton: {
    marginLeft: 4,
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
  buttonContainer: {
    flexDirection: "row",
  },
});
