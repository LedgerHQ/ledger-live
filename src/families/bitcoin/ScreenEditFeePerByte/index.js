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
import { translate, Trans } from "react-i18next";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { BigNumber } from "bignumber.js";

import colors from "../../../colors";
import { accountScreenSelector } from "../../../reducers/accounts";
import { getAccountBridge } from "../../../bridge";
import type { Transaction } from "../../../bridge/RNLibcoreAccountBridge";

import Button from "../../../components/Button";
import KeyboardView from "../../../components/KeyboardView";
import FeesRow from "./FeesRow";
import CustomFeesRow from "./CustomFeesRow";

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
  feePerByte: ?BigNumber,
};

class BitcoinEditFeePerByte extends Component<Props, State> {
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
    const { navigation } = this.props;
    const { feePerByte } = this.state;
    const transaction: Transaction = navigation.getParam("transaction");
    if (!transaction) return null;
    const items = transaction.networkInfo
      ? transaction.networkInfo.feeItems.items
      : [];
    const selectedItem =
      feePerByte &&
      items.find(item => item.feePerByte && item.feePerByte.eq(feePerByte));
    const selectedKey = selectedItem ? selectedItem.key : "custom";
    return (
      <SafeAreaView style={styles.root}>
        <KeyboardView style={styles.container}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              {items.map(item => (
                <FeesRow
                  key={item.key}
                  title={item.label}
                  value={item.feePerByte}
                  isSelected={item.key === selectedKey}
                  onPress={this.onChangeFeePerByte}
                />
              ))}
              <CustomFeesRow
                title={<Trans i18nKey="fees.speed.custom" />}
                initialValue={feePerByte}
                onPress={this.onChangeFeePerByte}
                isSelected={selectedKey === "custom"}
              />
              <View style={styles.buttonContainer}>
                <Button
                  type="primary"
                  title={<Trans i18nKey="send.fees.validate" />}
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

export default compose(
  connect(mapStateToProps),
  translate(),
)(BitcoinEditFeePerByte);
