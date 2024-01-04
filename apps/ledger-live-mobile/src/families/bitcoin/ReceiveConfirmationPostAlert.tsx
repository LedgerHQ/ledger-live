import type { Account } from "@ledgerhq/types-live";
import React from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import Alert from "~/components/Alert";

type Props = {
  mainAccount: Account;
};

export default function ReceiveConfirmationPostAlert({ mainAccount }: Props) {
  return (
    <>
      {mainAccount.currency.id === "dash" ? (
        <Alert type="warning">
          <Trans i18nKey="transfer.receive.receiveConfirmation.dashStakingWarning" />
        </Alert>
      ) : null}

      {mainAccount.derivationMode === "taproot" ? (
        <View style={styles.taprootWarning}>
          <Alert type="warning">
            <Trans i18nKey="transfer.receive.taprootWarning" />
          </Alert>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  taprootWarning: {
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "stretch",
  },
});
