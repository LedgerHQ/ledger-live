/* @flow */
import React, { PureComponent } from "react";
import { translate, Trans } from "react-i18next";
import { View, Image, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import colors from "../../colors";
import type { T } from "../../types/common";
import LText from "../../components/LText";
import BlueButton from "../../components/BlueButton";
import Receive from "../../icons/Receive";

class EmptyStateAccount extends PureComponent<{
  t: T,
  account: Account,
  navigation: NavigationScreenProp<*>,
}> {
  goToReceiveFunds = () => {
    const { navigation } = this.props;
    navigation.navigate("ReceiveFundsMain");
  };
  render() {
    const { t, account } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <Image source={require("../../images/EmptyStateAccount.png")} />
          <LText secondary semiBold style={styles.title}>
            {t("common:account.emptyState.title")}
          </LText>
          <LText style={styles.desc}>
            <Trans i18nKey="common:account.emptyState.desc">
              {"Make sure the"}
              <LText semiBold style={styles.managerAppName}>
                {account.currency.managerAppName}
              </LText>
              {"app is installed and start receiving"}
            </Trans>
          </LText>
          {null && ( // FIXME READONLYMVP
            <BlueButton
              title={t("common:account.emptyState.buttons.receiveFunds")}
              onPress={this.goToReceiveFunds}
              containerStyle={styles.recieveButton}
              titleStyle={[styles.buttonTitle]}
              iconLeft={<Receive size={16} color={colors.white} />}
            />
          )}
        </View>
      </View>
    );
  }
}

export default translate()(EmptyStateAccount);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    margin: 16,
    flexDirection: "column",
    justifyContent: "center",
  },
  body: {
    alignItems: "center",
  },
  buttonTitle: {
    fontSize: 16,
  },
  recieveButton: {
    height: 48,
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
    maxWidth: 280,
  },
  managerAppName: {
    color: colors.black,
  },
});
