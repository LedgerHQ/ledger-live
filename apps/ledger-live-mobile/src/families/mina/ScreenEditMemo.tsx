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
    ScreenName.MinaEditMemo
  >
>;

function MinaEditMemo({ navigation, route }: NavigationProps) {
  const isFocused = useIsFocused();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");
  const [memo, setMemo] = useState(route.params?.transaction.memo);
  const onChangeMemoValue = useCallback((str: string) => {
    setMemo(str === "" ? undefined : str);
  }, []);
  const onValidateText = useCallback(() => {
    const bridge = getAccountBridge(account);
    const { transaction } = route.params;
    // @ts-expect-error FIXME: No current / next navigation params?
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      transaction: bridge.updateTransaction(transaction, {
        memo: memo && memo.toString(),
      }),
    });
  }, [navigation, route.params, account, memo]);
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
        <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="always">
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
              value={memo?.toString() ?? ""}
              placeholder="Optional memo"
              keyboardType="default"
              returnKeyType="done"
              onChangeText={onChangeMemoValue}
              onSubmitEditing={onValidateText}
            />
          )}

          <View style={styles.flex}>
            <Button
              event="MinaEditMemo"
              type="primary"
              title={t("send.summary.validateMemo")}
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
  title: i18next.t("send.summary.memo.value"),
  headerLeft: undefined,
};
export { MinaEditMemo as component, options };
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
