/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import type { Account, Operation } from "@ledgerhq/live-common/lib/types";
import { BigNumber } from "bignumber.js";
import { getBridgeForCurrency } from "../../../bridge";
import { accountScreenSelector } from "../../../reducers/accounts";
import colors from "../../../colors";
import SelectDevice from "../../../components/SelectDevice";
import LText from "../../../components/LText";

import { tmpTestEthExchange } from "../../../logic/hw";

type Props = {
  account: Account,
  navigation: NavigationScreenProp<{
    accountId: string,
    address: string,
    amount: string,
    amountBigNumber: BigNumber,
    fees?: number,
  }>,
};

type State = {
  signed: boolean,
  result: ?Operation,
  error: ?Error,
  deviceId: ?string,
};

class Validation extends Component<Props, State> {
  static navigationOptions = {
    title: "Device",
  };

  state = {
    signed: false,
    result: null,
    error: null,
    deviceId: null,
  };

  sign() {
    const {
      account,
      navigation: {
        state: {
          // $FlowFixMe
          params: { address, amount },
        },
      },
    } = this.props;
    const { deviceId } = this.state;
    if (!deviceId) return;
    const bridge = getBridgeForCurrency(account.currency);
    let transaction = bridge.createTransaction(account);
    transaction = bridge.editTransactionRecipient(
      account,
      transaction,
      address,
    );
    transaction = bridge.editTransactionAmount(
      account,
      transaction,
      new BigNumber(amount),
    );
    // FIXME the concept of fees in bridge is not yet addressed. as it's very depend of the crypto, we need to unify it properly

    tmpTestEthExchange(deviceId);

    bridge.signAndBroadcast(account, transaction, deviceId).subscribe({
      next: e => {
        switch (e.type) {
          case "signed":
            this.setState({ signed: true });
            break;
          case "broadcasted":
            this.setState({ result: e.operation });
            break;
          default:
        }
      },
      error: error => {
        this.setState({ error });
      },
    });
  }

  onSelectDevice = (deviceId: string) => {
    this.setState({ deviceId }, this.sign);
  };

  render() {
    const { result, error, signed, deviceId } = this.state;
    return (
      <View style={styles.root}>
        {result ? (
          <LText>well done! {result.hash}</LText>
        ) : error ? (
          <LText>ERROR! {String(error)}</LText>
        ) : signed ? (
          <ActivityIndicator />
        ) : deviceId ? (
          <LText>Please validate transaction on your device...</LText>
        ) : (
          <SelectDevice onSelectItem={this.onSelectDevice} />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

const mapStateToProps = (state, props) => ({
  account: accountScreenSelector(state, props),
});

export default connect(mapStateToProps)(Validation);
