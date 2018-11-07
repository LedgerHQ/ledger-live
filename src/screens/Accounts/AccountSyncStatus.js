// @flow
import React, { Component, PureComponent } from "react";
import { translate } from "react-i18next";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import LiveLogo from "../../icons/LiveLogoIcon";
import colors from "../../colors";
import LText from "../../components/LText";
import Spinning from "../../components/Spinning";

class StatusQueued extends PureComponent<{
  t: *,
}> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <LText secondary style={styles.pendingText}>
          <Icon name="clock" size={14} color={colors.grey} />{" "}
          {t("accounts.row.queued")}
        </LText>
      </View>
    );
  }
}

class StatusSynchronizing extends PureComponent<{
  t: *,
}> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <Spinning>
          <LiveLogo size={14} color={colors.grey} />
        </Spinning>
        <LText secondary style={styles.pendingText}>
          {t("accounts.row.syncPending")}
        </LText>
      </View>
    );
  }
}

class StatusUpToDate extends PureComponent<{
  t: *,
}> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <Icon size={14} color={colors.green} name="check-circle" />
        <LText secondary style={styles.upToDateText}>
          {t("accounts.row.upToDate")}
        </LText>
      </View>
    );
  }
}

class StatusError extends PureComponent<{
  t: *,
}> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <Icon size={14} color={colors.alert} name="x-circle" />
        <LText secondary style={styles.errorText}>
          {t("accounts.row.error")}
        </LText>
      </View>
    );
  }
}

class AccountSyncStatus extends Component<{
  t: *,
  isUpToDateAccount: boolean,
  pending: boolean,
  error: ?Error,
}> {
  render() {
    const { t, isUpToDateAccount, pending, error } = this.props;
    if (isUpToDateAccount) return <StatusUpToDate t={t} />;
    if (!pending && error) return <StatusError t={t} />;
    if (pending) return <StatusSynchronizing t={t} />;
    return <StatusQueued t={t} />;
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

export default translate()(AccountSyncStatus);
