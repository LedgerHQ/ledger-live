/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import LText from "../../components/LText";
import Spinning from "../../components/Spinning";
import LiveLogo from "../../icons/LiveLogoIcon";
import colors from "../../colors";

export default class AppsListPending extends PureComponent<{}> {
  render() {
    return (
      <View style={styles.pending}>
        <Spinning>
          <LiveLogo color={colors.fog} size={32} />
        </Spinning>

        <LText style={styles.pendingText}>
          <Trans i18nKey="manager.appList.loading" />
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  pending: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.grey,
  },
});
