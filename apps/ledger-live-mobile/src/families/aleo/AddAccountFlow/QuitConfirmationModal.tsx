import React from "react";
import { StyleSheet } from "react-native";
import ConfirmationModal from "~/components/ConfirmationModal";
import { Trans } from "~/context/Locale";

const styles = StyleSheet.create({
  confirmationTitle: {
    textAlign: "left",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 32.4,
    letterSpacing: -0.72,
    marginBottom: 16,
    marginTop: -45,
  },
});

type Props = {
  isOpened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onModalHide?: () => void;
};

export default function QuitConfirmationModal({
  isOpened,
  onClose,
  onConfirm,
  onModalHide,
}: Props) {
  return (
    <ConfirmationModal
      isOpened={isOpened}
      onClose={onClose}
      onConfirm={onConfirm}
      onModalHide={onModalHide}
      confirmationTitle={<Trans i18nKey="addAccounts.quitConfirmation.v2.title" />}
      confirmButtonText={<Trans i18nKey="addAccounts.quitConfirmation.v2.cancel" />}
      rejectButtonText={<Trans i18nKey="addAccounts.quitConfirmation.v2.continue" />}
      cancelCTAConfig={{ type: "primary", outline: true }}
      customTitleStyle={styles.confirmationTitle}
    />
  );
}
