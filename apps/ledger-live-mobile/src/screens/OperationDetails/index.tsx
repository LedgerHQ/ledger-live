import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import type { Operation } from "@ledgerhq/types-live";
import {
  getDefaultExplorerView,
  getTransactionExplorer,
} from "@ledgerhq/live-common/explorers";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useTheme } from "@react-navigation/native";
import byFamiliesOperationDetails from "../../generated/operationDetails";
import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import NavigationScrollView from "../../components/NavigationScrollView";
import Footer from "./Footer";
import Content from "./Content";
import Close from "../../icons/Close";
import ArrowLeft from "../../icons/ArrowLeft";
import { withDiscreetMode } from "../../context/DiscreetModeContext";

const forceInset = {
  bottom: "always",
};
type RouteParams = {
  accountId: string;
  operation: Operation;
  disableAllLinks?: boolean;
};
type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};
export const BackButton = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={styles.buttons}
      onPress={() => navigation.goBack()}
    >
      <ArrowLeft size={18} color={colors.grey} />
    </TouchableOpacity>
  );
};
// TODO: this button is generic and is used in places unrelated to operation details
// move it to a generic place
export const CloseButton = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity // $FlowFixMe
      onPress={() => navigation.popToTop()}
      style={styles.buttons}
    >
      <Close size={18} color={colors.grey} />
    </TouchableOpacity>
  );
};

function OperationDetails({ route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  if (!account) return null;
  const operation = route.params?.operation;
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
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
      forceInset={forceInset}
    >
      <TrackScreen category="OperationDetails" />
      <NavigationScrollView>
        <View style={styles.root}>
          <Content
            account={account}
            parentAccount={parentAccount}
            operation={operation}
            disableAllLinks={route.params?.disableAllLinks}
          />
        </View>
      </NavigationScrollView>
      <Footer url={url} urlWhatIsThis={urlWhatIsThis} account={mainAccount} />
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
