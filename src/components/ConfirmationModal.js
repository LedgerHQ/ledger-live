// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import colors from "../colors";
import BottomModal from "./BottomModal";
import LText from "./LText";
import Button from "./Button";

type Props = {
  isOpened: boolean,
  onClose: () => void,
  onConfirm: () => void,
  confirmationTitle: React$Node,
  confirmationDesc: React$Node,
};

class ConfirmationModal extends PureComponent<Props> {
  static defaultProps = {
    confirmationTitle: "Are you sure?",
    confirmationDesc: "Please confirm you want to close",
  };

  render() {
    const {
      isOpened,
      onClose,
      confirmationTitle,
      confirmationDesc,
      onConfirm,
      ...rest
    } = this.props;
    return (
      <BottomModal
        isOpened={isOpened}
        onClose={onClose}
        style={styles.confirmationModal}
        {...rest}
      >
        <LText semiBold style={styles.confirmationTitle}>
          {confirmationTitle}
        </LText>
        <LText style={styles.confirmationDesc}>{confirmationDesc}</LText>
        <View style={styles.confirmationFooter}>
          <Button
            event="ConfirmationModalCancel"
            containerStyle={styles.confirmationButton}
            type="secondary"
            title="Cancel"
            onPress={onClose}
          />
          <Button
            event="ConfirmationModalConfirm"
            containerStyle={[
              styles.confirmationButton,
              styles.confirmationLastButton,
            ]}
            type="primary"
            title="Confirm"
            onPress={onConfirm}
          />
        </View>
      </BottomModal>
    );
  }
}

const styles = StyleSheet.create({
  confirmationModal: {
    paddingVertical: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  confirmationTitle: {
    textAlign: "center",
    fontSize: 14,
    color: colors.darkBlue,
  },
  confirmationDesc: {
    marginVertical: 24,
    textAlign: "center",
    fontSize: 14,
    color: colors.smoke,
  },
  confirmationFooter: {
    flexDirection: "row",
  },
  confirmationButton: {
    flexGrow: 1,
  },
  confirmationLastButton: {
    marginLeft: 16,
  },
});

export default ConfirmationModal;
