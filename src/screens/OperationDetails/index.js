/* @flow */
import React, { PureComponent } from "react";
import i18next from "i18next";
import { View, StyleSheet } from "react-native";
// $FlowFixMe
import { HeaderBackButton, SafeAreaView, ScrollView } from "react-navigation";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import type {
  Account,
  Operation,
  AccountLike,
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
import HeaderBackImage from "../../components/HeaderBackImage";

const forceInset = { bottom: "always" };

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  navigation: Navigation,
};

type Navigation = NavigationScreenProp<{
  params: {
    accountId: string,
    operation: Operation,
  },
}>;

const BackButton = ({ navigation }: { navigation: Navigation }) => (
  <HeaderBackButton
    tintColor={colors.grey}
    onPress={() => {
      navigation.goBack();
    }}
  >
    <HeaderBackImage />
  </HeaderBackButton>
);

class OperationDetails extends PureComponent<Props, *> {
  static navigationOptions = ({ navigation }) => {
    const {
      params: { isSubOperation },
    } = navigation.state;

    if (isSubOperation) {
      return {
        title: i18next.t("operationDetails.title"),
        headerLeft: <BackButton navigation={navigation} />,
        headerRight: null,
      };
    }

    return {
      title: i18next.t("operationDetails.title"),
      headerLeft: null,
    };
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
      <SafeAreaView style={styles.container} forceInset={forceInset}>
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
