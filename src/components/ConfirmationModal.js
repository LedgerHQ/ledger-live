// @flow

import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";

import colors, { rgba } from "../colors";
import BottomModal from "./BottomModal";
import LText from "./LText";
import Button from "./Button";

type Props = {|
  isOpened: boolean,
  onClose: () => void,
  onConfirm: () => *,
  onModalHide?: () => *,
  confirmationTitle?: React$Node,
  confirmationDesc?: React$Node,
  Icon?: React$ComponentType<*>,
  confirmButtonText?: React$Node,
  rejectButtonText?: React$Node,
  alert: boolean,
|};

class ConfirmationModal extends PureComponent<Props> {
  static defaultProps = {
    alert: false,
  };

  render() {
    const {
      isOpened,
      onClose,
      confirmationTitle,
      confirmationDesc,
      confirmButtonText,
      rejectButtonText,
      onConfirm,
      Icon,
      alert,
      ...rest
    } = this.props;
    return (
      <BottomModal
        id="ConfirmationModal"
        isOpened={isOpened}
        onClose={onClose}
        style={styles.confirmationModal}
        {...rest}
      >
        {Icon && (
          <View style={styles.icon}>
            <Icon size={24} />
          </View>
        )}
        {confirmationTitle && (
          <LText secondary semiBold style={styles.confirmationTitle}>
            {confirmationTitle}
          </LText>
        )}
        {confirmationDesc && (
          <LText style={styles.confirmationDesc}>{confirmationDesc}</LText>
        )}
        <View style={styles.confirmationFooter}>
          <Button
            event="ConfirmationModalCancel"
            containerStyle={styles.confirmationButton}
            type="secondary"
            title={rejectButtonText || <Trans i18nKey="common.cancel" />}
            onPress={onClose}
          />
          <Button
            event="ConfirmationModalConfirm"
            containerStyle={[
              styles.confirmationButton,
              styles.confirmationLastButton,
            ]}
            type={alert ? "alert" : "primary"}
            title={confirmButtonText || <Trans i18nKey="common.confirm" />}
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
    fontSize: 18,
    color: colors.darkBlue,
  },
  confirmationDesc: {
    marginVertical: 24,
    paddingHorizontal: 32,
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
  icon: {
    alignSelf: "center",
    backgroundColor: rgba(colors.alert, 0.08),
    width: 56,
    borderRadius: 28,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ConfirmationModal;
