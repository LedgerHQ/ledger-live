// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import type { OperationType } from "@ledgerhq/live-common/lib/types";

import ReceiveIcon from "../images/icons/Receive";
import SendIcon from "../images/icons/Send";

import colors from "../colors";

type Props = {
  type: OperationType,
  size: number,
  containerSize: number,
};

export default class OperationIcon extends PureComponent<Props> {
  render() {
    const { type, size, containerSize } = this.props;
    let icon;
    let bgColor;

    if (type === "IN") {
      icon = <ReceiveIcon size={size} color={colors.green} />;
      bgColor = colors.translucentGreen;
    } else {
      icon = <SendIcon size={size} color={colors.grey} />;
      bgColor = colors.translucentGrey;
    }

    return (
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: bgColor,
            width: containerSize,
            height: containerSize,
          },
        ]}
      >
        {icon}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  iconContainer: {
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});
