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
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { BigNumber } from "bignumber.js";

import colors from "../../colors";

import { accountScreenSelector } from "../../reducers/accounts";
import { getAccountBridge } from "../../bridge";

import Button from "../../components/Button";
import KeyboardView from "../../components/KeyboardView";

import FeesRow from "./FeesRow";
import CustomFeesRow from "./CustomFeesRow";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    accountId: string,
    transaction: *,
  }>,
};
type State = {
  feePerByte: ?BigNumber,
};

// TODO current impl is only for Bitcoin family. we need to split components
// into many files and dispatch from here.
class FeeSettings extends Component<Props, State> {
  static navigationOptions = {
    title: "Edit fees",
  };

  constructor({ account, navigation }) {
    super();
    const bridge = getAccountBridge(account);
    const transaction = navigation.getParam("transaction");
    this.state = {
      feePerByte: bridge.getTransactionExtra(
        account,
        transaction,
        "feePerByte",
      ),
    };
  }

  onChangeFeePerByte = (feePerByte: ?BigNumber) =>
    this.setState({ feePerByte });

  onValidateFees = () => {
    const { navigation, account } = this.props;
    const { feePerByte } = this.state;
    const bridge = getAccountBridge(account);
    const transaction = navigation.getParam("transaction");
    Keyboard.dismiss();

    navigation.navigate("SendSummary", {
      accountId: account.id,
      transaction: bridge.editTransactionExtra(
        account,
        transaction,
        "feePerByte",
        feePerByte,
      ),
    });
  };

  render() {
    const { feePerByte } = this.state;
    return (
      <SafeAreaView style={styles.root}>
        <KeyboardView style={styles.container}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <FeesRow
                title="Low"
                value={BigNumber(5)}
                currentValue={feePerByte}
                onPress={this.onChangeFeePerByte}
              />
              <FeesRow
                title="Standard"
                value={BigNumber(10)}
                currentValue={feePerByte}
                onPress={this.onChangeFeePerByte}
              />
              <FeesRow
                title="High"
                value={BigNumber(15)}
                currentValue={feePerByte}
                onPress={this.onChangeFeePerByte}
              />
              <CustomFeesRow
                title="Custom"
                currentValue={feePerByte}
                onPress={this.onChangeFeePerByte}
                isSelected={
                  !BigNumber(5).eq(feePerByte || 0) &&
                  !BigNumber(10).eq(feePerByte || 0) &&
                  !BigNumber(15).eq(feePerByte || 0)
                }
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

export default connect(mapStateToProps)(FeeSettings);
