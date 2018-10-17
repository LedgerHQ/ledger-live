// @flow
import React, { PureComponent, Fragment } from "react";
import { StyleSheet } from "react-native";
import { translate } from "react-i18next";

import type { T } from "../../types/common";
import colors from "../../colors";

import LText from "../LText";

type Props = {
  t: T,
};

class QRCodeTopLayer extends PureComponent<Props> {
  render() {
    const { t } = this.props;
    return (
      <Fragment>
        <LText semibold style={styles.text}>
          {t("account.import.scan.descTop.line1")}
        </LText>
        <LText bold style={styles.text}>
          {t("account.import.scan.descTop.line2")}
        </LText>
      </Fragment>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 32,
    textAlign: "center",
    color: colors.white,
  },
});

export default translate()(QRCodeTopLayer);
