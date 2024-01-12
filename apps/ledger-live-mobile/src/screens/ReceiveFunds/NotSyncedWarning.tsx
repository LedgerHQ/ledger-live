import React from "react";

import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import LText from "~/components/LText";
import { deviceNames } from "../../wording";
import PendingContainer from "../PairDevices/PendingContainer";

const styles = StyleSheet.create({
  title: {
    marginTop: 32,
    fontSize: 18,
    lineHeight: 27,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});

type Props = {
  accountId: string;
};

const NotSyncedWarning = (props: Props) => {
  return (
    <PendingContainer>
      <SyncOneAccountOnMount priority={100} accountId={props.accountId} />
      <LText secondary semiBold style={styles.title}>
        <Trans i18nKey="transfer.receive.notSynced.text" />
      </LText>
      <LText style={styles.subtitle} color="smoke">
        <Trans i18nKey="transfer.receive.notSynced.desc" values={deviceNames.nanoX} />
      </LText>
    </PendingContainer>
  );
};

export default NotSyncedWarning;
