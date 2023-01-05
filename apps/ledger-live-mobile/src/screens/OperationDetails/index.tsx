import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import {
  getDefaultExplorerView,
  getTransactionExplorer,
} from "@ledgerhq/live-common/explorers";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { ParamListBase, useTheme } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Operation } from "@ledgerhq/types-live";
import byFamiliesOperationDetails from "../../generated/operationDetails";
import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import NavigationScrollView from "../../components/NavigationScrollView";
import Footer from "./Footer";
import Content from "./Content";
import Close from "../../icons/Close";
import ArrowLeft from "../../icons/ArrowLeft";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import {
  RootComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "../../const";

type NavigatorProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.OperationDetails>
>;

export const BackButton = ({
  navigation,
}: {
  navigation: StackNavigationProp<ParamListBase>;
}) => {
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
export const CloseButton = ({
  navigation,
}: {
  navigation: StackNavigationProp<ParamListBase>;
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => navigation.popToTop()}
      style={styles.buttons}
    >
      <Close size={18} color={colors.grey} />
    </TouchableOpacity>
  );
};

function OperationDetails({ route }: NavigatorProps) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  if (!account) return null;
  const operation = route.params?.operation;
  const mainAccount = getMainAccount(account, parentAccount);
  const url = getTransactionExplorer(
    getDefaultExplorerView(mainAccount.currency),
    operation.hash,
  );
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
