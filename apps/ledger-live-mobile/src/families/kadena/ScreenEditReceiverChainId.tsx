import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useIsFocused, useTheme } from "@react-navigation/native";
import i18next from "i18next";
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import Button from "~/components/Button";
import TextInput from "~/components/FocusedTextInput";
import KeyboardView from "~/components/KeyboardView";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    SendFundsNavigatorStackParamList | SignTransactionNavigatorParamList | SwapNavigatorParamList,
    ScreenName.KadenaEditReceiverChainId
  >
>;

function KadenaEditReceiverChainId({ navigation, route }: NavigationProps) {
  const isFocused = useIsFocused();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");

  const [receiverChainId, setReceiverChainId] = useState<number | null>(
    route.params?.transaction.receiverChainId ?? 0,
  );
  const onValidateReceiverChainID = useCallback((value: string) => {
    const parsedValue = parseInt(value);
    if (!isNaN(parsedValue) || value === "") {
      setReceiverChainId(value !== "" ? parsedValue : null);
    }
  }, []);

  const onValidateChainID = useCallback(() => {
    const bridge = getAccountBridge(account);
    const { transaction } = route.params;
    // @ts-expect-error FIXME: No current / next navigation params?
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      transaction: bridge.updateTransaction(transaction, {
        receiverChainId,
      }),
    });
  }, [navigation, route.params, account, receiverChainId]);

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
            value={receiverChainId?.toString() ?? ""}
            keyboardType="number-pad"
            maxLength={String(2).length}
            placeholder="Eg: 1"
            returnKeyType="done"
            onChangeText={onValidateReceiverChainID}
            onSubmitEditing={onValidateChainID}
          />
        )}
        <View style={styles.flex}>
          <Button
            event="KadenaReceiverChainId"
            type="primary"
            title={t("send.summary.validateChainId")}
            onPress={onValidateChainID}
            containerStyle={styles.buttonContainer}
            disabled={receiverChainId === null}
          />
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
}

const options = {
  title: i18next.t("operationDetails.extra.receiverChainId"),
  headerLeft: undefined,
};
export { KadenaEditReceiverChainId as component, options };

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
