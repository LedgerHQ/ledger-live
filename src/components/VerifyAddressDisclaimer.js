// @flow
import React, { memo } from "react";
import { View, StyleSheet, Image } from "react-native";

import { useTheme } from "@react-navigation/native";
import shield from "../images/shield.png";
import shieldWarning from "../images/shield-warning.png";
import shieldCheckmark from "../images/shield-checkmark.png";

import LText from "./LText";

type Props = {
  text: React$Node,
  unsafe?: boolean,
  verified?: boolean,
  action?: React$Node,
};

// FIXME this component should be renamed to something more generic!
// on desktop, we call it warnbox
function VerifyAddressDisclaimer({ unsafe, verified, text, action }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.wrapper,
        unsafe
          ? { borderColor: colors.alert, backgroundColor: colors.lightAlert }
          : { backgroundColor: colors.card },
      ]}
    >
      <Image
        source={unsafe ? shieldWarning : verified ? shieldCheckmark : shield}
      />
      <View style={styles.textWrapper}>
        <LText style={[styles.text]} color={unsafe ? "alert" : "grey"}>
          {text}
        </LText>
        {action || null}
      </View>
    </View>
  );
}

VerifyAddressDisclaimer.defaultProps = {
  unsafe: false,
  verified: false,
};

const styles = StyleSheet.create({
  wrapper: {
    padding: 10,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  textWrapper: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    paddingLeft: 8,
  },
});

export default memo<Props>(VerifyAddressDisclaimer);
