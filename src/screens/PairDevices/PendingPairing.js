// @flow

import React, { Fragment, PureComponent } from "react";
import { StyleSheet } from "react-native";

import colors from "../../colors";
import LText from "../../components/LText";

class PendingPairing extends PureComponent<*> {
  render() {
    return (
      <Fragment>
        <LText secondary semiBold style={styles.title}>
          Pairing...
        </LText>
        <LText style={styles.subtitle}>
          Please don’t turn off your Nano X. Follow screen instructions.
        </LText>
      </Fragment>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    marginTop: 16,
    fontSize: 18,
    color: colors.darkBlue,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default PendingPairing;
