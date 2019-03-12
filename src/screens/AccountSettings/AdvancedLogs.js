/* @flow */
import React, { PureComponent } from "react";
import i18next from "i18next";
import { View, StyleSheet } from "react-native";
// $FlowFixMe
import { ScrollView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { accountScreenSelector } from "../../reducers/accounts";
import { updateAccount } from "../../actions/accounts";
import LText from "../../components/LText";
import { localeIds } from "../../languages";
import colors from "../../colors";

type Props = {
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
  updateAccount: Function,
  account: Account,
};

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});
const mapDispatchToProps = {
  updateAccount,
};
class AdvancedLogs extends PureComponent<Props> {
  static navigationOptions = {
    title: i18next.t("account.settings.advanced.title"),
    headerRight: null,
  };

  render() {
    const { account } = this.props;
    const usefulData = {
      xpub: account.xpub || undefined,
      index: account.index,
      freshAddressPath: account.freshAddressPath,
      id: account.id,
      blockHeight: account.blockHeight,
    };

    const readableDate = account.lastSyncDate.toLocaleDateString(localeIds, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <ScrollView contentContainerStyle={styles.root}>
        <View style={styles.body}>
          <LText semiBold style={styles.sync}>
            {i18next.t("common.sync.ago", { time: readableDate })}
          </LText>
          <LText selectable monospace style={styles.mono}>
            {JSON.stringify(usefulData, null, 2)}
          </LText>
        </View>
      </ScrollView>
    );
  }
}

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(AdvancedLogs);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
    paddingBottom: 64,
  },
  body: {
    flexDirection: "column",
    flex: 1,
  },
  sync: {
    marginBottom: 16,
  },

  mono: {
    fontSize: 14,
    color: colors.darkBlue,
  },
});
