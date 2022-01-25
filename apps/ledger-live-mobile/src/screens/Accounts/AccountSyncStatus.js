// @flow
import React, { memo } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import { useTheme } from "@react-navigation/native";
import LiveLogo from "../../icons/LiveLogoIcon";
import LText from "../../components/LText";
import Spinning from "../../components/Spinning";

function StatusQueued() {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <Icon name="clock" size={14} color={colors.grey} />
      <LText
        numberOfLines={1}
        secondary
        semiBold
        style={styles.pendingText}
        color="grey"
      >
        <Trans i18nKey="accounts.row.queued" />
      </LText>
    </View>
  );
}

function StatusSynchronizing() {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <Spinning>
        <LiveLogo size={14} color={colors.grey} />
      </Spinning>
      <LText
        numberOfLines={1}
        secondary
        semiBold
        style={styles.pendingText}
        color="grey"
      >
        <Trans i18nKey="accounts.row.syncPending" />
      </LText>
    </View>
  );
}

function StatusUpToDate() {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <Icon size={14} color={colors.green} name="check-circle" />
      <LText
        numberOfLines={1}
        secondary
        semiBold
        style={styles.upToDateText}
        color="grey"
      >
        <Trans i18nKey="accounts.row.upToDate" />
      </LText>
    </View>
  );
}

function StatusError() {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <Icon size={14} color={colors.alert} name="x-circle" />
      <LText
        numberOfLines={1}
        secondary
        semiBold
        style={styles.errorText}
        color="alert"
      >
        <Trans i18nKey="accounts.row.error" />
      </LText>
    </View>
  );
}

type Props = {
  isUpToDateAccount: boolean,
  pending: boolean,
  error: ?Error,
};

function AccountSyncStatus({ isUpToDateAccount, pending, error }: Props) {
  if (pending && !isUpToDateAccount) return <StatusSynchronizing />;
  if (error) return <StatusError />;
  if (isUpToDateAccount) return <StatusUpToDate />;
  return <StatusQueued />;
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
  },
  pendingText: {
    fontSize: 14,
    marginLeft: 6,
  },
  upToDateText: {
    fontSize: 14,
    marginLeft: 6,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 6,
  },
});

export default memo<Props>(AccountSyncStatus);
