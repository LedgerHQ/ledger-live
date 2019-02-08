/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import colors from "../../colors";
import LText from "../../components/LText";
import PendingContainer from "../PairDevices/PendingContainer";
import { deviceNames } from "../../wording";

class NotSyncedWarning extends PureComponent<{ continue: () => void }> {
  render() {
    return (
      <PendingContainer>
        <LText secondary semiBold style={styles.title}>
          <Trans i18nKey="transfer.receive.notSynced.text" />
        </LText>
        <LText style={styles.subtitle}>
          <Trans
            i18nKey="transfer.receive.notSynced.desc"
            values={deviceNames.nanoX}
          />
        </LText>
      </PendingContainer>
    );
  }
}

export default NotSyncedWarning;

const styles = StyleSheet.create({
  title: {
    marginTop: 32,
    fontSize: 18,
    color: colors.darkBlue,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
    paddingHorizontal: 24,
    color: colors.smoke,
  },
});
