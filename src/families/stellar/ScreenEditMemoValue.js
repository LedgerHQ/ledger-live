// @flow
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { View, StyleSheet, TextInput, ScrollView } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import type { Transaction } from "@ledgerhq/live-common/lib/families/stellar/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { useTheme } from "@react-navigation/native";
import KeyboardView from "../../components/KeyboardView";
import Button from "../../components/Button";
import { ScreenName } from "../../const";
import { accountScreenSelector } from "../../reducers/accounts";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  memoType: string,
};

function StellarEditMemoValue({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");

  const [memoValue, setMemoValue] = useState(
    route.params.transaction.memoValue,
  );

  const onChangeMemoValue = useCallback((str: string) => {
    setMemoValue(str);
  }, []);

  const onValidateText = useCallback(() => {
    const bridge = getAccountBridge(account);
    const { transaction, memoType } = route.params;
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      transaction: bridge.updateTransaction(transaction, {
        memoValue: memoValue && memoValue.toString(),
        memoType: memoType && memoType.toString(),
      }),
    });
  }, [navigation, route.params, account, memoValue]);

  return (
    <SafeAreaView style={{ flex: 1 }} forceInset={forceInset}>
      <KeyboardView
        style={[styles.body, { backgroundColor: colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.root}
          keyboardShouldPersistTaps="always"
        >
          <TextInput
            allowFontScaling={false}
            autoFocus
            style={[styles.textInputAS, { color: colors.darkBlue }]}
            defaultValue={memoValue ? memoValue.toString() : ""}
            keyboardType="default"
            returnKeyType="done"
            onChangeText={onChangeMemoValue}
            onSubmitEditing={onValidateText}
          />

          <View style={styles.flex}>
            <Button
              event="StellarEditMemoValue"
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
  headerLeft: null,
};

export { StellarEditMemoValue as component, options };

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
