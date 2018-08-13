// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import type { OperationType } from "@ledgerhq/live-common/lib/types";

import ReceiveIcon from "../images/icons/Receive";
import SendIcon from "../images/icons/Send";

import colors from "./../colors";

type Props = {
  type: OperationType,
  size: number,
};

export default class OperationIcon extends PureComponent<Props> {
  render() {
    const { type, size } = this.props;

    if (type === "IN") {
      return (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.translucentGreen },
          ]}
        >
          <ReceiveIcon size={size} color={colors.green} />
        </View>
      );
    }

    return (
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.translucentGrey },
        ]}
      >
        <SendIcon size={size} color={colors.grey} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  iconContainer: {
    height: 28,
    width: 28,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});
