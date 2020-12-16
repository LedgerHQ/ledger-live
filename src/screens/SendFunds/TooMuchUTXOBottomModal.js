// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import colors from "../../colors";
import BottomModal from "../../components/BottomModal";
import LText from "../../components/LText";
import Button from "../../components/Button";
import Info from "../../icons/Info";
import TrackScreen from "../../analytics/TrackScreen";

type Props = {
  isOpened: boolean,
  onClose: () => void,
  onPress: Function,
};

class ConfirmationModal extends PureComponent<Props> {
  render() {
    const { isOpened, onClose, onPress, ...rest } = this.props;
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
        <View style={styles.icon}>
          <Info size={24} color={colors.orange} />
        </View>
        <LText secondary semiBold style={styles.title}>
          <Trans i18nKey="send.tooMuchUTXOBottomModal.title" />
        </LText>
        <LText style={styles.description}>
          <Trans i18nKey="send.tooMuchUTXOBottomModal.description" />
        </LText>
        <View style={styles.confirmationFooter}>
          <Button
            containerStyle={styles.confirmationButton}
            type="primary"
            title={<Trans i18nKey="send.tooMuchUTXOBottomModal.cta" />}
            onPress={onPress}
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
    backgroundColor: colors.lightOrange,
    width: 56,
    borderRadius: 28,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
});

export default ConfirmationModal;
