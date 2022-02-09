/* @flow */
import React, { memo } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { useTheme } from "@react-navigation/native";
import Circle from "../../components/Circle";
import Alert from "../../components/Alert";
import LText from "../../components/LText";
import Trash from "../../icons/Trash";
import ModalBottomAction from "../../components/ModalBottomAction";
import Button from "../../components/Button";

type Props = {
  onRequestClose: () => void,
  deleteAccount: () => void,
  account: Account,
};

// FIXME this is not a modal \o/
function DeleteAccountModal({ onRequestClose, deleteAccount }: Props) {
  const { colors } = useTheme();
  return (
    <ModalBottomAction
      title={<Trans i18nKey="account.settings.delete.confirmationTitle" />}
      shouldWrapDesc={false}
      icon={
        <Circle bg={colors.lightAlert} size={56}>
          <Trash size={24} color={colors.alert} />
        </Circle>
      }
      description={
        <View>
          <LText style={styles.description} color="grey">
            <Trans i18nKey="account.settings.delete.confirmationDesc" />
          </LText>
          <Alert type="warning">
            <Trans i18nKey="account.settings.delete.confirmationWarn" />
          </Alert>
        </View>
      }
      footer={
        <View style={styles.footerContainer}>
          <Button
            event="DeleteAccountCancel"
            type="secondary"
            title={<Trans i18nKey="common.cancel" />}
            onPress={onRequestClose}
            containerStyle={styles.buttonContainer}
          />
          <Button
            event="DeleteAccount"
            type="alert"
            title={<Trans i18nKey="common.delete" />}
            onPress={deleteAccount}
            containerStyle={[styles.buttonContainer, styles.buttonMarginLeft]}
          />
        </View>
      }
    />
  );
}

export default memo<Props>(DeleteAccountModal);

const styles = StyleSheet.create({
  accountName: {},
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 16,
  },
  buttonContainer: {
    flexGrow: 1,
    marginTop: 24,
  },
  buttonMarginLeft: {
    marginLeft: 16,
  },
});
