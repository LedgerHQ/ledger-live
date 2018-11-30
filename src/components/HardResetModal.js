/* @flow */

import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";

import colors from "../colors";
import ModalBottomAction from "./ModalBottomAction";
import Trash from "../icons/Trash";
import Button from "./Button";
import Circle from "./Circle";

type Props = {
  onRequestClose: () => void,
  onHardReset: () => void,
};

// FIXME this is not a modal \o/
class HardResetModal extends PureComponent<Props> {
  render() {
    const { onRequestClose, onHardReset } = this.props;
    return (
      <ModalBottomAction
        title={null}
        icon={
          <Circle bg={colors.lightAlert} size={56}>
            <Trash size={24} color={colors.alert} />
          </Circle>
        }
        description={<Trans i18nKey="reset.description" />}
        footer={
          <View style={styles.footerContainer}>
            <Button
              event="HardResetModalCancel"
              type="secondary"
              title={<Trans i18nKey="common.cancel" />}
              onPress={onRequestClose}
              containerStyle={styles.buttonContainer}
            />
            <Button
              event="HardResetModalAction"
              type="alert"
              title={<Trans i18nKey="reset.button" />}
              onPress={onHardReset}
              containerStyle={[styles.buttonContainer, styles.buttonMarginLeft]}
            />
          </View>
        }
      />
    );
  }
}

export default HardResetModal;

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
  },
  buttonContainer: {
    flex: 1,
  },
  buttonMarginLeft: {
    marginLeft: 16,
  },
});
