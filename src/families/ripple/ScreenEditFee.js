// @flow
import React, { Component } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { BigNumber } from "bignumber.js";

import colors from "../../colors";
import { accountScreenSelector } from "../../reducers/accounts";
import { getAccountBridge } from "../../bridge";
import type { Transaction } from "../../bridge/RippleJSBridge";

import CurrencyInput from "../../components/CurrencyInput";
import Button from "../../components/Button";
import KeyboardView from "../../components/KeyboardView";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      transaction: Transaction,
    },
  }>,
};
type State = {
  fee: ?BigNumber,
};

class RippleEditFee extends Component<Props, State> {
  static navigationOptions = {
    title: "Edit fees",
  };

  constructor({ account, navigation }) {
    super();
    const bridge = getAccountBridge(account);
    const transaction = navigation.getParam("transaction");
    this.state = {
      fee: bridge.getTransactionExtra(account, transaction, "fee"),
    };
  }

  onChange = (fee: ?BigNumber) => this.setState({ fee });

  onValidateFees = () => {
    const { navigation, account } = this.props;
    const { fee } = this.state;
    const bridge = getAccountBridge(account);
    const transaction = navigation.getParam("transaction");
    Keyboard.dismiss();

    navigation.navigate("SendSummary", {
      accountId: account.id,
      transaction: bridge.editTransactionExtra(
        account,
        transaction,
        "fee",
        fee,
      ),
    });
  };

  render() {
    const { navigation, account } = this.props;
    const { fee } = this.state;
    const transaction: Transaction = navigation.getParam("transaction");
    if (!transaction) return null;
    return (
      <SafeAreaView style={styles.root}>
        <KeyboardView style={styles.container}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <CurrencyInput
                unit={account.unit}
                value={fee}
                onChange={this.onChange}
              />

              <View style={styles.buttonContainer}>
                <Button
                  type="primary"
                  title="Validate Fees"
                  containerStyle={styles.continueButton}
                  onPress={this.onValidateFees}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  buttonContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  continueButton: {
    alignSelf: "stretch",
  },
  container: {
    flex: 1,
  },
});

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default connect(mapStateToProps)(translate()(RippleEditFee));
