// @flow
import React, { Component, PureComponent } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import LiveLogo from "../../icons/LiveLogoIcon";
import colors from "../../colors";
import LText from "../../components/LText";
import Spinning from "../../components/Spinning";

class StatusQueued extends PureComponent<{}> {
  render() {
    return (
      <View style={styles.root}>
        <Icon name="clock" size={14} color={colors.grey} />
        <LText secondary semiBold style={styles.pendingText}>
          <Trans i18nKey="accounts.row.queued" />
        </LText>
      </View>
    );
  }
}

class StatusSynchronizing extends PureComponent<{}> {
  render() {
    return (
      <View style={styles.root}>
        <Spinning>
          <LiveLogo size={14} color={colors.grey} />
        </Spinning>
        <LText secondary semiBold style={styles.pendingText}>
          <Trans i18nKey="accounts.row.syncPending" />
        </LText>
      </View>
    );
  }
}

class StatusUpToDate extends PureComponent<{}> {
  render() {
    return (
      <View style={styles.root}>
        <Icon size={14} color={colors.green} name="check-circle" />
        <LText secondary semiBold style={styles.upToDateText}>
          <Trans i18nKey="accounts.row.upToDate" />
        </LText>
      </View>
    );
  }
}

class StatusError extends PureComponent<{}> {
  render() {
    return (
      <View style={styles.root}>
        <Icon size={14} color={colors.alert} name="x-circle" />
        <LText secondary semiBold style={styles.errorText}>
          <Trans i18nKey="accounts.row.error" />
        </LText>
      </View>
    );
  }
}

class AccountSyncStatus extends Component<{
  isUpToDateAccount: boolean,
  pending: boolean,
  error: ?Error,
}> {
  render() {
    const { isUpToDateAccount, pending, error } = this.props;
    if (isUpToDateAccount) return <StatusUpToDate />;
    if (!pending && error) return <StatusError />;
    if (pending) return <StatusSynchronizing />;
    return <StatusQueued />;
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
  },
  pendingText: {
    fontSize: 14,
    color: colors.grey,
    marginLeft: 6,
  },
  upToDateText: {
    fontSize: 14,
    color: colors.grey,
    marginLeft: 6,
  },
  errorText: {
    fontSize: 14,
    color: colors.alert,
    marginLeft: 6,
  },
});

export default AccountSyncStatus;
