import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { getDefaultExplorerView, getTransactionExplorer } from "@ledgerhq/live-common/explorers";
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
  const url = getTransactionExplorer(getDefaultExplorerView(mainAccount.currency), operation.hash);

  const currency = getAccountCurrency(account);
  const mainAccountCurrency = getAccountCurrency(mainAccount);

  const specific =
    byFamiliesOperationDetails[
      mainAccount.currency.family as keyof typeof byFamiliesOperationDetails
    ];
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
    <SafeAreaView edges={["bottom"]} style={[styles.container]}>
      <TrackScreen category="OperationDetails" />
      <NavigationScrollView>
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
    </SafeAreaView>
  );
}

export default withDiscreetMode(OperationDetails);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  root: {
    paddingTop: 24,
    paddingBottom: 64,
  },
  buttons: {
    padding: 16,
  },
});
