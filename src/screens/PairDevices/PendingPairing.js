// @flow

import React, { Fragment, PureComponent } from "react";
import { StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import colors from "../../colors";
import LText from "../../components/LText";
import { deviceNames } from "../../wording";

class PendingPairing extends PureComponent<*> {
  render() {
    return (
      <Fragment>
        <LText secondary semiBold style={styles.title}>
          <Trans i18nKey="PairDevices.Pairing.title" />
        </LText>
        <LText style={styles.subtitle}>
          <Trans
            i18nKey="PairDevices.Pairing.subtitle"
            values={deviceNames.nanoX}
          />
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
