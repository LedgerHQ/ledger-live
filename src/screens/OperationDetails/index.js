/* @flow */
import React, { PureComponent } from "react";
import i18next from "i18next";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView, ScrollView } from "react-navigation";
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
import byFamiliesOperationDetails from "../../generated/operationDetails";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import Footer from "./Footer";
import Content from "./Content";
import colors from "../../colors";
import Close from "../../icons/Close";
import ArrowLeft from "../../icons/ArrowLeft";

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
  <TouchableOpacity style={styles.buttons} onPress={() => navigation.goBack()}>
    <ArrowLeft size={18} color={colors.grey} />
  </TouchableOpacity>
);

const CloseButton = ({ navigation }: { navigation: Navigation }) => (
  <TouchableOpacity
    // $FlowFixMe
    onPress={() => navigation.popToTop()}
    style={styles.buttons}
  >
    <Close size={18} color={colors.grey} />
  </TouchableOpacity>
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
        headerRight: <CloseButton navigation={navigation} />,
      };
    }

    return {
      title: i18next.t("operationDetails.title"),
      headerLeft: <BackButton navigation={navigation} />,
      headerRight: null,
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
    const specific = byFamiliesOperationDetails[mainAccount.currency.family];
    const urlWhatIsThis =
      specific &&
      specific.getURLWhatIsThis &&
      specific.getURLWhatIsThis(operation);

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
        <Footer url={url} urlWhatIsThis={urlWhatIsThis} />
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
  buttons: {
    padding: 16,
  },
});
