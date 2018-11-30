// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet, Image } from "react-native";

import shield from "../images/shield.png";
import shieldWarning from "../images/shield-warning.png";
import shieldCheckmark from "../images/shield-checkmark.png";

import colors from "../colors";

import LText from "./LText";

type Props = {
  text: React$Node,
  unsafe?: boolean,
  verified?: boolean,
  action?: React$Node,
};

class VerifyAddressDisclaimer extends PureComponent<Props> {
  static defaultProps = {
    unsafe: false,
    verified: false,
  };

  render() {
    const { unsafe, verified, text, action } = this.props;

    return (
      <View
        style={[
          styles.wrapper,
          unsafe ? styles.wrapperWarning : undefined,
          verified ? styles.wrapperVerified : null,
        ]}
      >
        <Image
          source={unsafe ? shieldWarning : verified ? shieldCheckmark : shield}
        />
        <View style={styles.textWrapper}>
          <LText
            style={[
              styles.text,
              unsafe ? styles.textWarning : undefined,
              verified ? styles.textVerified : null,
            ]}
          >
            {text}
          </LText>
          {action || null}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 12,
    borderRadius: 4,
    backgroundColor: colors.pillActiveBackground,
    flexDirection: "row",
    alignItems: "center",
  },
  wrapperWarning: {
    borderColor: colors.alert,
    backgroundColor: colors.lightAlert,
  },
  wrapperVerified: {
    borderColor: colors.green,
    backgroundColor: colors.lightGrey,
  },
  textWrapper: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    color: colors.live,
    lineHeight: 21,
    paddingLeft: 8,
  },
  textWarning: {
    color: colors.alert,
  },
  textVerified: {
    color: colors.grey,
  },
});

export default VerifyAddressDisclaimer;
