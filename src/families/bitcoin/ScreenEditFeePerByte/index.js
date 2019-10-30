// @flow
import React, { Component } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-navigation";
import { connect } from "react-redux";
import { translate, Trans } from "react-i18next";
import i18next from "i18next";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";

import { BigNumber } from "bignumber.js";
import colors from "../../../colors";
import { accountScreenSelector } from "../../../reducers/accounts";

import Button from "../../../components/Button";
import KeyboardView from "../../../components/KeyboardView";
import FeesRow from "./FeesRow";
import CustomFeesRow from "./CustomFeesRow";
import { track } from "../../../analytics";

const forceInset = { bottom: "always" };

type Transaction = *;

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
  focusedItemKey: string,
  error?: boolean,
};

class BitcoinEditFeePerByte extends Component<Props, State> {
  static navigationOptions = {
    title: i18next.t("operationDetails.title"),
    headerLeft: null,
  };

  static default;

  items: Array<*>;

  constructor({ account, navigation }) {
    super();
    const bridge = getAccountBridge(account);
    const transaction: Transaction = navigation.getParam("transaction");

    this.items = transaction.networkInfo
      ? transaction.networkInfo.feeItems.items
      : [];

    const feePerByte = bridge.getTransactionExtra(
      account,
      transaction,
      "feePerByte",
    );

    const selectedItem =
      feePerByte &&
      this.items.find(
        item => item.feePerByte && item.feePerByte.eq(feePerByte),
      );

    const focusedItemKey = selectedItem ? selectedItem.key : "custom";

    this.state = {
      feePerByte: bridge.getTransactionExtra(
        account,
        transaction,
        "feePerByte",
      ),
      focusedItemKey,
    };
  }

  onChangeCustomFeeRow = (feePerByte: BigNumber) => {
    this.setState({
      feePerByte,
      focusedItemKey: "custom",
      error: !feePerByte.isGreaterThan(0),
    });
    track("SendChangeCustomFees");
  };

  onChangeFeeRow = (feePerByte: ?BigNumber, key: string) => {
    this.setState({ feePerByte, focusedItemKey: key, error: undefined });
    Keyboard.dismiss();
  };

  onValidateFees = () => {
    const { navigation, account } = this.props;
    const { feePerByte } = this.state;
    const bridge = getAccountBridge(account);
    const transaction = navigation.getParam("transaction");
    Keyboard.dismiss();

    navigation.navigate("SendSummary", {
      accountId: account.id,
      transaction: bridge.updateTransaction(transaction, { feePerByte }),
    });
  };

  render() {
    const { navigation } = this.props;
    const { feePerByte, focusedItemKey, error } = this.state;
    const transaction: Transaction = navigation.getParam("transaction");
    if (!transaction) return null;

    const isCustom = focusedItemKey === "custom";

    return (
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <KeyboardView style={styles.container}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              {this.items.map(item => (
                <FeesRow
                  key={item.key}
                  itemKey={item.key}
                  title={<Trans i18nKey={`fees.speed.${item.speed}`} />}
                  value={item.feePerByte}
                  isSelected={item.key === focusedItemKey}
                  onPress={this.onChangeFeeRow}
                />
              ))}
              <CustomFeesRow
                initialValue={isCustom ? feePerByte : null}
                title={<Trans i18nKey="fees.speed.custom" />}
                isValid={!error}
                onPress={this.onChangeCustomFeeRow}
                isSelected={isCustom}
              />
              <View style={styles.buttonContainer}>
                <Button
                  event="BitcoinEditFeePerByteContinue"
                  type="primary"
                  disabled={!!error}
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
    flexDirection: "column",
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
  error: {
    alignSelf: "center",
    color: colors.alert,
    fontSize: 14,
    marginBottom: 8,
  },
});

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});

export default compose(
  connect(mapStateToProps),
  translate(),
)(BitcoinEditFeePerByte);
