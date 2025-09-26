import React from "react";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import LText from "~/components/LText";
import { deviceNames } from "../../wording";
import Spinning from "~/components/Spinning";
import LiveLogo from "~/icons/LiveLogoIcon";

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
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

type Props = {
  accountId: string;
};

const PendingContainer = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      <Spinning>
        <LiveLogo color={colors.grey} size={32} />
      </Spinning>

      {children}
    </View>
  );
};

// Note: is this code really reachable? It renders the old logo of Ledger Live (before 2021), so maybe it's dead code ...
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
