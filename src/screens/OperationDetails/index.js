/* @flow */
import React, { PureComponent } from "react";
import i18next from "i18next";
import { View, StyleSheet } from "react-native";
// $FlowFixMe
import { SafeAreaView, ScrollView } from "react-navigation";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import type {
  TokenAccount,
  Account,
  Operation,
} from "@ledgerhq/live-common/lib/types";
import {
  getDefaultExplorerView,
  getTransactionExplorer,
} from "@ledgerhq/live-common/lib/explorers";
import { getMainAccount } from "@ledgerhq/live-common/lib/account";
import type { NavigationScreenProp } from "react-navigation";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import Footer from "./Footer";
import Content from "./Content";
import colors from "../../colors";

type Props = {
  account: ?(Account | TokenAccount),
  parentAccount: ?Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      operation: Operation,
    },
  }>,
};
class OperationDetails extends PureComponent<Props, *> {
  static navigationOptions = {
    title: i18next.t("operationDetails.title"),
    headerLeft: null,
  };

  render() {
    const { navigation, account, parentAccount } = this.props;
    if (!account) return null;
    const operation = navigation.getParam("operation");
    const mainAccount = getMainAccount(account, parentAccount);
    const url = getTransactionExplorer(
      getDefaultExplorerView(mainAccount.currency),
      operation.hash,
    );
    return (
      <SafeAreaView style={styles.container}>
        <TrackScreen category="OperationDetails" />
        <ScrollView>
          <View style={styles.root}>
            <Content
              account={account}
              parentAccount={parentAccount}
              operation={operation}
              navigation={navigation}
            />
          </View>
        </ScrollView>
        {url && <Footer url={url} />}
      </SafeAreaView>
    );
  }
}

export default connect(accountAndParentScreenSelector)(
  translate()(OperationDetails),
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  root: {
    paddingTop: 24,
    paddingBottom: 64,
  },
});
