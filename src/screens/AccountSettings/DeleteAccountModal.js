/* @flow */
import React, { PureComponent } from "react";
import { translate, Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import LText from "../../components/LText";
import Circle from "../../components/Circle";
import Trash from "../../icons/Trash";
import type { T } from "../../types/common";
import colors from "../../colors";
import ModalBottomAction from "../../components/ModalBottomAction";
import RedButton from "../../components/RedButton";
import GreyButton from "../../components/GreyButton";

type Props = {
  t: T,
  onRequestClose: () => void,
  deleteAccount: () => void,
  account: Account,
};

class DeleteAccountModal extends PureComponent<Props> {
  render() {
    const { account, t, onRequestClose, deleteAccount } = this.props;
    return (
      <ModalBottomAction
        title={null}
        icon={
          <Circle bg={colors.lightAlert} size={56}>
            <Trash size={24} color={colors.alert} />
          </Circle>
        }
        description={
          <Trans i18nKey="common:account.settings.delete.confirmationDesc">
            {"Are you sure you want to delete "}
            <LText bold>{account.name}</LText>
            {"account"}
          </Trans>
        }
        footer={
          <View style={styles.footerContainer}>
            <GreyButton
              title={t("common:common.cancel")}
              onPress={onRequestClose}
              containerStyle={styles.buttonContainer}
              titleStyle={styles.buttonTitle}
            />
            <RedButton
              title={t("common:common.delete")}
              onPress={deleteAccount}
              containerStyle={[styles.buttonContainer, styles.deleteButtonBg]}
              titleStyle={[styles.buttonTitle, styles.deleteButtonTitle]}
            />
          </View>
        }
      />
    );
  }
}

export default translate()(DeleteAccountModal);

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  buttonContainer: {
    height: 48,
    width: 136,
  },
  deleteButtonBg: {
    backgroundColor: colors.alert,
  },
  buttonTitle: {
    fontSize: 16,
  },
  deleteButtonTitle: {
    color: colors.white,
  },
});
