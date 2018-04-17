/* @flow */
import React, { PureComponent } from "react";
import moment from "moment";
import { View, StyleSheet } from "react-native";
import type { Account, Operation } from "@ledgerhq/wallet-common/lib/types";
import LText from "../../components/LText";
import OperationRowAmount from "../../components/OperationRowAmount";
import Touchable from "../../components/Touchable";

class OperationRow extends PureComponent<{
  operation: Operation,
  account: Account,
  onPress: (operation: Operation, account: Account) => void
}> {
  onPress = () => {
    const { operation, account, onPress } = this.props;
    return onPress(operation, account);
  };

  render() {
    const { operation, account } = this.props;
    return (
      <Touchable onPress={this.onPress}>
        <View style={styles.root}>
          <View style={styles.body}>
            <LText
              numberOfLines={1}
              ellipsizeMode="middle"
              style={styles.address}
            >
              {operation.address}
            </LText>
            <LText numberOfLines={1} style={styles.time}>
              {moment(operation.date).format("HH:mm")}
            </LText>
          </View>
          <OperationRowAmount operation={operation} account={account} />
        </View>
      </Touchable>
    );
  }
}

export default OperationRow;

const styles = StyleSheet.create({
  root: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
    alignItems: "center",
    flexDirection: "row"
  },
  body: {
    flexDirection: "column",
    flex: 1,
    marginHorizontal: 10
  },
  address: {
    fontSize: 12
  },
  time: {
    fontSize: 12,
    opacity: 0.5
  }
});
