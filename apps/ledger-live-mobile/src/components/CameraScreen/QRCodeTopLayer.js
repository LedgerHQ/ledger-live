// @flow
import React from "react";
import { StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import LText from "../LText";

const QRCodeTopLayer = () => (
  <>
    <LText semiBold style={styles.text}>
      <Trans i18nKey="account.import.scan.descTop.line1" />
    </LText>
    <LText bold style={styles.text}>
      <Trans i18nKey="account.import.scan.descTop.line2" />
    </LText>
  </>
);

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 32,
    textAlign: "center",
    color: "#fff",
  },
});

export default QRCodeTopLayer;
