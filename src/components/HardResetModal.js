/* @flow */

import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import { translate } from "react-i18next";
import type { T } from "../types/common";
import colors from "../colors";
import ModalBottomAction from "./ModalBottomAction";
import Trash from "../images/icons/Trash";
import RedButton from "./RedButton";
import GreyButton from "./GreyButton";
import Circle from "./Circle";

type Props = {
  t: T,
  onRequestClose: () => void,
  onHardReset: () => void,
};
class HardResetModal extends PureComponent<Props> {
  render() {
    const { t, onRequestClose, onHardReset } = this.props;
    return (
      <ModalBottomAction
        title={null}
        icon={
          <Circle bg={colors.lightAlert} size={56}>
            <Trash size={24} color={colors.alert} />
          </Circle>
        }
        description={t("reset.description")}
        footer={
          <View style={styles.footerContainer}>
            <GreyButton
              title={t("common.cancel")}
              onPress={onRequestClose}
              containerStyle={styles.buttonContainer}
              titleStyle={styles.buttonTitle}
            />
            <RedButton
              title={t("reset.button")}
              onPress={onHardReset}
              containerStyle={[styles.buttonContainer, styles.resetButtonBg]}
              titleStyle={[styles.buttonTitle, styles.resetButtonTitle]}
            />
          </View>
        }
      />
    );
  }
}

export default translate()(HardResetModal);

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  buttonContainer: {
    height: 48,
    width: 136,
  },
  resetButtonBg: {
    backgroundColor: colors.alert,
  },
  buttonTitle: {
    fontSize: 16,
  },
  resetButtonTitle: {
    color: colors.white,
  },
});
