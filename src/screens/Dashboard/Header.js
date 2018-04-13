/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/wallet-common/lib/types";
import LText from "../../components/LText";
import { withLocale } from "../../components/LocaleContext";
import type { TranslateFunction } from "../../components/LocaleContext";
import NetworkIndicator from "../../components/NetworkIndicator";

class Header extends Component<{
  accounts: Account[],
  t: TranslateFunction
}> {
  render() {
    const { t, accounts } = this.props;
    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LText style={styles.headerText}>
            {t("home_title", { name: "John Doe" })}
          </LText>
          <LText style={styles.headerTextSubtitle}>
            {t("home_subtitle", { count: accounts.length })}
          </LText>
        </View>
        <NetworkIndicator />
      </View>
    );
  }
}

export default withLocale(Header);

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    flexDirection: "row",
    paddingLeft: 10,
    paddingRight: 10
  },
  headerLeft: {
    justifyContent: "space-around"
  },
  headerTextSubtitle: {
    color: "white",
    opacity: 0.8,
    fontSize: 12
  },
  headerText: {
    color: "white",
    fontSize: 16
  }
});
