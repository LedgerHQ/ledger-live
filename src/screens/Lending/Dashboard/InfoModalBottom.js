// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import colors, { rgba } from "../../../colors";
import BottomModal from "../../../components/BottomModal";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import TrackScreen from "../../../analytics/TrackScreen";

type button = {
  title: string,
  onPress: Function,
};

type Props = {
  isOpened: boolean,
  onClose: () => void,
  onConfirm: () => *,
  onModalHide?: () => *,
  title?: React$Node,
  description?: React$Node,
  Icon?: React$ComponentType<*>,
  buttons: button[],
  alert: boolean,
};

class ConfirmationModal extends PureComponent<Props> {
  static defaultProps = {
    alert: false,
  };

  render() {
    const {
      isOpened,
      onClose,
      title,
      description,
      onConfirm,
      Icon,
      alert,
      buttons,
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
        {isOpened ? (
          <TrackScreen category="LendingNoTokenAccountInfoModal" />
        ) : null}
        {Icon && (
          <View style={styles.icon}>
            <Icon size={24} />
          </View>
        )}
        {title && (
          <LText secondary semiBold style={styles.title}>
            {title}
          </LText>
        )}
        {description && <LText style={styles.description}>{description}</LText>}
        <View style={styles.confirmationFooter}>
          <Button
            containerStyle={styles.confirmationButton}
            type="primary"
            title={buttons[0].title}
            onPress={buttons[0].onPress}
          />

          {buttons[1] ? (
            <Button
              containerStyle={[
                styles.confirmationButton,
                styles.confirmationLastButton,
              ]}
              type="secondary"
              title={buttons[1].title}
              onPress={buttons[1].onPress}
            />
          ) : null}
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
  title: {
    textAlign: "center",
    fontSize: 18,
    color: colors.darkBlue,
  },
  description: {
    marginVertical: 32,
    textAlign: "center",
    fontSize: 14,
    color: colors.smoke,
  },
  confirmationFooter: {
    justifyContent: "flex-end",
  },
  confirmationButton: {
    flexGrow: 1,
  },
  confirmationLastButton: {
    marginTop: 16,
  },
  icon: {
    alignSelf: "center",
    backgroundColor: rgba(colors.yellow, 0.08),
    width: 56,
    borderRadius: 28,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
});

export default ConfirmationModal;
