import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useIsFocused, useTheme } from "@react-navigation/native";
import KeyboardView from "~/components/KeyboardView";
import Button from "~/components/Button";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import TextInput from "~/components/FocusedTextInput";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    SendFundsNavigatorStackParamList | SignTransactionNavigatorParamList | SwapNavigatorParamList,
    ScreenName.KadenaEditChainID
  >
>;

function KadenaEditComment({ navigation, route }: NavigationProps) {
  const isFocused = useIsFocused();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");

  const onValidateText = useCallback(() => {
    const bridge = getAccountBridge(account);
    const { transaction } = route.params;
    // @ts-expect-error FIXME: No current / next navigation params?
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      transaction: bridge.updateTransaction(transaction, {
        senderChainID: 0,
      }),
    });
  }, [navigation, route.params, account]);
  return (
    <SafeAreaView style={styles.root}>
    </SafeAreaView>
  );
}

const options = {
  title: i18next.t("send.summary.comment"),
  headerLeft: undefined,
};
export { KadenaEditComment as component, options };
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flexDirection: "column",
    flex: 1,
  },
  textInputAS: {
    padding: 16,
    fontSize: 24,
  },
  buttonContainer: {
    marginHorizontal: 16,
  },
  flex: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
});