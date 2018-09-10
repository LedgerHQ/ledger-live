// @flow

import React, { Component } from "react";
import { StyleSheet } from "react-native";

import Touchable from "../../components/Touchable";
import colors from "../../colors";

type Props = {
  onPress: () => void,
  Icon: React$ComponentType<*>,
};

class AccountTopBarAction extends Component<Props> {
  render() {
    const { onPress, Icon } = this.props;
    return (
      <Touchable style={styles.root} onPress={onPress}>
        <Icon size={16} color={colors.grey} />
      </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AccountTopBarAction;
