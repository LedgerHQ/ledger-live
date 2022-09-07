import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/lib/families/hedera/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { useTheme } from "@react-navigation/native";
import KeyboardView from "../../components/KeyboardView";
import Button from "../../components/Button";
import { ScreenName } from "../../const";
import TextInput from "../../components/FocusedTextInput";

const forceInset = {
  bottom: "always",
};
type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};
type RouteParams = {
  account: Account;
  transaction: Transaction;
};

function HederaEditMemo({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [memo, setMemo] = useState(route.params.transaction.memo);
  const account = route.params.account;
  const onValidateText = useCallback(() => {
    const bridge = getAccountBridge(account);
    const { transaction } = route.params;
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      transaction: bridge.updateTransaction(transaction, {
        memo,
      }),
    });
  }, [navigation, route.params, account, memo]);
  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
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
          <TextInput
            allowFontScaling={false}
            autoFocus
            style={[
              styles.textInputAS,
              {
                color: colors.darkBlue,
              },
            ]}
            defaultValue={memo}
            keyboardType="default"
            returnKeyType="done"
            onChangeText={setMemo}
            onSubmitEditing={onValidateText}
          />

          <View style={styles.flex}>
            <Button
              event="HederaEditMemoContinue"
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
  headerLeft: null,
};
export { HederaEditMemo as component, options };
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
