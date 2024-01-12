import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useTheme } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import i18next from "i18next";
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "~/components/Button";
import TextInput from "~/components/FocusedTextInput";
import KeyboardView from "~/components/KeyboardView";
import { BaseComposite } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "~/const";

type NavigationProps = BaseComposite<
  StackScreenProps<SendFundsNavigatorStackParamList, ScreenName.SolanaEditMemo>
>;

function SolanaEditMemo({ navigation, route }: NavigationProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { model } = route.params.transaction;

  invariant(model.kind === "transfer", "must be a transfer tx");

  const [memo, setMemo] = useState(model.uiState.memo);
  const account = route.params.account;

  const onValidateText = useCallback(() => {
    const bridge = getAccountBridge(account);
    const { transaction } = route.params;
    const nextTx = bridge.updateTransaction(transaction, {
      model: {
        ...transaction.model,
        uiState: {
          ...transaction.model.uiState,
          memo,
        },
      },
    });
    // @ts-expect-error FIXME: no current / next navigation param?
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      transaction: nextTx,
    });
  }, [navigation, route.params, account, memo]);

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardView style={[styles.body, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="always">
          <TextInput
            allowFontScaling={false}
            autoFocus
            style={[styles.textInputAS, { color: colors.darkBlue }]}
            defaultValue={memo}
            keyboardType="default"
            returnKeyType="done"
            onChangeText={setMemo}
            multiline
            onSubmitEditing={onValidateText}
          />

          <View style={styles.flex}>
            <Button
              event="SolanaEditMemoContinue"
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
  title: i18next.t("send.summary.memo.title"),
  headerLeft: undefined,
};

export { SolanaEditMemo as component, options };

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
