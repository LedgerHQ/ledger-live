import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useTheme } from "@react-navigation/native";
import KeyboardView from "~/components/KeyboardView";
import Button from "~/components/Button";
import { ScreenName } from "~/const";
import TextInput from "~/components/FocusedTextInput";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";

type Props = StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.CosmosFamilyEditMemo>;

function CosmosFamilyEditMemo({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [memo, setMemo] = useState(route.params.transaction.memo);
  const account = route.params.account;
  const currencyName = account.currency.name;

  const onValidateText = useCallback(() => {
    const bridge = getAccountBridge(account);
    const { transaction } = route.params;
    navigation.navigate(ScreenName.SendSummary, {
      ...route.params,
      accountId: account.id,
      transaction: bridge.updateTransaction(transaction, {
        memo,
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
          <TextInput
            allowFontScaling={false}
            autoFocus
            style={[
              styles.textInputAS,
              {
                color: colors.darkBlue,
              },
            ]}
            defaultValue={memo || ""}
            keyboardType="default"
            returnKeyType="done"
            onChangeText={setMemo}
            onSubmitEditing={onValidateText}
          />

          <View style={styles.flex}>
            <Button
              event={`${currencyName}EditMemoContinue`}
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

export { CosmosFamilyEditMemo as component, options };

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
