import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { DefaultTheme } from "styled-components/native";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import { rgba, Theme, withTheme } from "../../../colors";
import QueuedDrawer from "../../../components/QueuedDrawer";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import TrackScreen from "../../../analytics/TrackScreen";

type button = {
  title: React.ReactNode;
  onPress: React.ComponentProps<typeof Button>["onPress"];
};
type Props = {
  isOpened: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onModalHide?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  Icon?: IconType;
  buttons: button[];
  alert?: boolean;
  colors: Theme["colors"] & DefaultTheme["colors"];
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
      colors,
      ...rest
    } = this.props;
    return (
      <QueuedDrawer
        {...rest}
        isRequestingToBeOpened={isOpened}
        onClose={onClose}
        style={styles.confirmationModal}
      >
        {isOpened ? (
          <TrackScreen category="LendingNoTokenAccountInfoModal" />
        ) : null}
        {Icon && (
          <View
            style={[
              styles.icon,
              {
                backgroundColor: rgba(colors.yellow, 0.08),
              },
            ]}
          >
            <Icon size={24} />
          </View>
        )}
        {title && (
          <LText secondary semiBold style={styles.title}>
            {title}
          </LText>
        )}
        {description && (
          <LText style={styles.description} color="smoke">
            {description}
          </LText>
        )}
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
      </QueuedDrawer>
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
  },
  description: {
    marginVertical: 32,
    textAlign: "center",
    fontSize: 14,
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
    width: 56,
    borderRadius: 28,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
});
export default withTheme(ConfirmationModal);
