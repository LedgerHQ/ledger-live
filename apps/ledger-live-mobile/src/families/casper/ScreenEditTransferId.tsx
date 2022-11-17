import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useIsFocused, useTheme } from "@react-navigation/native";
import KeyboardView from "../../components/KeyboardView";
import Button from "../../components/Button";
import { ScreenName } from "../../const";
import { accountScreenSelector } from "../../reducers/accounts";
import TextInput from "../../components/FocusedTextInput";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "../../components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "../../components/RootNavigator/types/SignTransactionNavigator";
import { LendingEnableFlowParamsList } from "../../components/RootNavigator/types/LendingEnableFlowNavigator";
import { LendingSupplyFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingSupplyFlowNavigator";
import { LendingWithdrawFlowNavigatorParamList } from "../../components/RootNavigator/types/LendingWithdrawFlowNavigator";
import { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    | LendingEnableFlowParamsList
    | LendingSupplyFlowNavigatorParamList
    | LendingWithdrawFlowNavigatorParamList
    | SendFundsNavigatorStackParamList
    | SignTransactionNavigatorParamList
    | SwapNavigatorParamList,
    ScreenName.CasperEditTransferId
  >
>;

function CasperEditTransferId({ navigation, route }: NavigationProps) {
  const isFocused = useIsFocused();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const [transferId, setTransferId] = useState(
    route.params?.transaction.transferId,
  );
  const onChangeTransferIdValue = useCallback((str: string) => {
    let value: string = str;
    value = str.replace(/\D/g, "");
    setTransferId(value === "" ? undefined : value);
  }, []);
  const onValidateText = useCallback(() => {
    const bridge = getAccountBridge(account);
    const { transaction } = route.params;
    // @ts-expect-error FIXME: No current / next navigation params?
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      transaction: bridge.updateTransaction(transaction, {
        transferId: transferId && transferId.toString(),
      }),
    });
  }, [navigation, route.params, account, transferId]);
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardView
        style={[
          styles.body,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.root}
          keyboardShouldPersistTaps="always"
        >
          {isFocused && (
            <TextInput
              allowFontScaling={false}
              autoFocus
              style={[
                styles.textInputAS,
                {
                  color: colors.darkBlue,
                },
              ]}
              value={transferId?.toString() ?? ""}
              placeholder="Eg: 1658490330"
              keyboardType="number-pad"
              returnKeyType="done"
              onChangeText={onChangeTransferIdValue}
              onSubmitEditing={onValidateText}
            />
          )}

          <View style={styles.flex}>
            <Button
              event="CasperEditTransferId"
              type="primary"
              title={t("send.summary.validateTransferId")}
              onPress={onValidateText}
              containerStyle={styles.buttonContainer}
            />
          </View>
        </ScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}

const options = {
  title: i18next.t("send.summary.transferId"),
  headerLeft: undefined,
};
export { CasperEditTransferId as component, options };
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
    fontSize: 30,
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
