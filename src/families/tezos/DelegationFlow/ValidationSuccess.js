/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { connect } from "react-redux";
import { translate, Trans } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import type {
  TokenAccount,
  Account,
  Operation,
  Transaction,
} from "@ledgerhq/live-common/lib/types";
import { accountAndParentScreenSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
import colors from "../../../colors";
import PreventNativeBack from "../../../components/PreventNativeBack";
import ValidateSuccess from "../../../components/ValidateSuccess";
import Button from "../../../components/Button";
import { urls } from "../../../config/urls";

type Props = {
  account: ?(TokenAccount | Account),
  parentAccount: ?Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      deviceId: string,
      transaction: Transaction,
      result: Operation,
    },
  }>,
};

class ValidationSuccess extends Component<Props> {
  static navigationOptions = {
    header: null,
    gesturesEnabled: false,
  };

  dismiss = () => {
    const { navigation } = this.props;
    if (navigation.dismiss) {
      const dismissed = navigation.dismiss();
      if (!dismissed) navigation.goBack();
    }
  };

  goToAccount = () => {
    const { navigation, account, parentAccount } = this.props;
    if (!account) return;
    navigation.navigate("Account", {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
    });
  };

  goToHelp = () => {
    Linking.openURL(urls.delegation);
  };

  render() {
    const transaction = this.props.navigation.getParam("transaction");
    if (transaction.family !== "tezos") return null;
    return (
      <View style={styles.root}>
        <TrackScreen category="SendFunds" name="ValidationSuccess" />
        <PreventNativeBack />
        <ValidateSuccess
          title={
            <Trans
              i18nKey={"delegation.broadcastSuccessTitle." + transaction.mode}
            />
          }
          description={
            <Trans
              i18nKey={
                "delegation.broadcastSuccessDescription." + transaction.mode
              }
            />
          }
          primaryButton={
            <Button
              event="DelegationSuccessGoToAccount"
              title={<Trans i18nKey="delegation.goToAccount" />}
              type="primary"
              containerStyle={styles.button}
              onPress={this.goToAccount}
            />
          }
          secondaryButton={
            <Button
              event="DelegationSuccessHowTo"
              title={<Trans i18nKey="delegation.howDelegationWorks" />}
              type="lightSecondary"
              containerStyle={styles.button}
              onPress={this.goToHelp}
            />
          }
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  button: {
    alignSelf: "stretch",
    marginTop: 24,
  },
});

const mapStateToProps = accountAndParentScreenSelector;

export default connect(mapStateToProps)(translate()(ValidationSuccess));
