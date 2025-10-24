import React from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaViewFixed from "~/components/SafeAreaView";
import { useSelector } from "react-redux";
import {
  getDefaultExplorerView,
  getTransactionExplorer as getDefaultTransactionExplorer,
} from "@ledgerhq/live-common/explorers";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { Operation } from "@ledgerhq/types-live";

import byFamiliesOperationDetails from "../../generated/operationDetails";
import { accountScreenSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import NavigationScrollView from "~/components/NavigationScrollView";
import Footer from "./Footer";
import Content from "./Content";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import Config from "react-native-config";

type NavigatorProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.OperationDetails>
>;

function OperationDetails({ route }: NavigatorProps) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  if (!account) {
    return null;
  }

  const { operation } = route.params;

  const mainAccount = getMainAccount(account, parentAccount);
  const currency = getAccountCurrency(account);
  const mainAccountCurrency = getAccountCurrency(mainAccount);

  const specific =
    byFamiliesOperationDetails[
      mainAccount.currency.family as keyof typeof byFamiliesOperationDetails
    ];

  const getTransactionExplorer =
    specific && "getTransactionExplorer" in specific && specific.getTransactionExplorer;
  const url = getTransactionExplorer
    ? getTransactionExplorer(getDefaultExplorerView(mainAccount.currency), operation)
    : getDefaultTransactionExplorer(getDefaultExplorerView(mainAccount.currency), operation.hash);

  const urlWhatIsThis =
    specific &&
    (
      specific as typeof specific & {
        getURLWhatIsThis: (_: Operation, c: string) => string;
      }
    ).getURLWhatIsThis &&
    (
      specific as typeof specific & {
        getURLWhatIsThis: (_: Operation, c: string) => string;
      }
    ).getURLWhatIsThis(operation, mainAccount.currency.id);

  return (
    <SafeAreaViewFixed
      isFlex
      edges={["left", "right", "bottom"]}
      useDetoxInsets={Config.DETOX === "1"}
    >
      <TrackScreen category="OperationDetails" />
      <NavigationScrollView testID="operation-details-scroll-view">
        <View style={styles.root}>
          <Content
            account={account}
            parentAccount={parentAccount}
            operation={operation}
            currency={currency}
            mainAccount={mainAccount}
            disableAllLinks={route.params?.disableAllLinks}
          />
        </View>
      </NavigationScrollView>
      <Footer url={url} urlWhatIsThis={urlWhatIsThis} currency={mainAccountCurrency} />
    </SafeAreaViewFixed>
  );
}

export default withDiscreetMode(OperationDetails);

const styles = StyleSheet.create({
  root: {
    paddingTop: 24,
    paddingBottom: 64,
  },
  buttons: {
    padding: 16,
  },
});
