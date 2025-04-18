import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet, Image, StyleProp, ViewStyle } from "react-native";
import { rgba, Theme, withTheme } from "../colors";
import QueuedDrawer from "./QueuedDrawer";
import LText from "./LText";
import Button, { BaseButtonProps } from "./Button";
import type { Props as BottomModalProps } from "./QueuedDrawer";
import { CtaConfig } from "./NavigationHeaderCloseButton";

type Props = {
  isOpened: boolean;
  onClose?: () => void;
  onConfirm: BaseButtonProps["onPress"];
  onModalHide?: BottomModalProps["onModalHide"];
  confirmationTitle?: React.ReactNode;
  confirmationDesc?: React.ReactNode;
  Icon?: React.ComponentType<{ size: number; color?: string }>;
  iconColor?: string;
  image?: number;
  confirmButtonText?: React.ReactNode;
  rejectButtonText?: React.ReactNode;
  hideRejectButton?: boolean;
  alert?: boolean;
  colors: Theme["colors"];
  preventBackdropClick?: boolean;
  iconMarginBottom?: number;
  testID?: string;
  customTitleStyle?: StyleProp<ViewStyle>;
  customDescriptionStyle?: StyleProp<ViewStyle>;
  cancelCTAConfig?: Partial<CtaConfig>;
  confirmCTAConfig?: Partial<CtaConfig>;
};

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
      iconColor,
      image,
      alert,
      hideRejectButton,
      colors,
      iconMarginBottom,
      customTitleStyle,
      customDescriptionStyle,
      confirmCTAConfig,
      cancelCTAConfig,
      ...rest
    } = this.props;
    const iColor = iconColor || colors.live;
    return (
      <QueuedDrawer
        isRequestingToBeOpened={isOpened}
        onClose={onClose}
        style={styles.confirmationModal}
        {...rest}
      >
        {Icon && (
          <View
            style={[
              styles.icon,
              {
                backgroundColor: rgba(iColor, 0.08),
                marginBottom: iconMarginBottom || 0,
              },
            ]}
          >
            <Icon size={24} color={iColor} />
          </View>
        )}
        {image && (
          <View style={styles.imageContainer}>
            <Image style={styles.image} source={image} resizeMode="contain" />
          </View>
        )}
        {confirmationTitle && (
          <LText secondary semiBold style={[styles.confirmationTitle, customTitleStyle]}>
            {confirmationTitle}
          </LText>
        )}
        {confirmationDesc && (
          <LText style={[styles.confirmationDesc, customDescriptionStyle]} color="smoke">
            {confirmationDesc}
          </LText>
        )}
        <View style={styles.confirmationFooter}>
          {!hideRejectButton && (
            <Button
              event="ConfirmationModalCancel"
              containerStyle={styles.confirmationButton}
              type={cancelCTAConfig?.type ?? "secondary"}
              title={rejectButtonText || <Trans i18nKey="common.cancel" />}
              testID="confirmation-modal-cancel-button"
              onPress={onClose}
              outline={cancelCTAConfig?.outline}
            />
          )}

          <Button
            event="ConfirmationModalConfirm"
            containerStyle={[styles.confirmationButton, styles.confirmationLastButton]}
            type={alert ? "alert" : confirmCTAConfig?.type ?? "primary"}
            title={confirmButtonText || <Trans i18nKey="common.confirm" />}
            testID="confirmation-modal-confirm-button"
            onPress={onConfirm}
            outline={confirmCTAConfig?.outline}
          />
        </View>
      </QueuedDrawer>
    );
  }
}

const styles = StyleSheet.create({
  confirmationModal: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  confirmationTitle: {
    textAlign: "center",
    fontSize: 18,
  },
  confirmationDesc: {
    marginVertical: 24,
    paddingHorizontal: 32,
    textAlign: "center",
    fontSize: 14,
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
    width: 56,
    borderRadius: 28,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 120,
    marginBottom: 16,
  },
  image: {
    height: "100%",
    width: "100%",
  },
});
export default withTheme(ConfirmationModal);
