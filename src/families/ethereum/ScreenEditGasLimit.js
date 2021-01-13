/* @flow */
import invariant from "invariant";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { BigNumber } from "bignumber.js";
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, StyleSheet, TextInput, View } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ethereum/types";
import { useTheme } from "@react-navigation/native";
import { i18n } from "../../context/Locale";
import Button from "../../components/Button";
import KeyboardView from "../../components/KeyboardView";
import NavigationScrollView from "../../components/NavigationScrollView";
import { accountScreenSelector } from "../../reducers/accounts";

const forceInset = { bottom: "always" };

const options = {
  title: i18n.t("send.summary.gasLimit"),
  headerLeft: null,
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  currentNavigation: string,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

function EthereumEditGasLimit({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const transaction = route.params?.transaction;

  invariant(account && transaction, "account and transaction required");

  const [gasLimit, setGasLimit] = useState(
    transaction.userGasLimit || transaction.estimatedGasLimit,
  );

  const onValidateText = useCallback(() => {
    const bridge = getAccountBridge(account, parentAccount);

    Keyboard.dismiss();
    const { currentNavigation } = route.params;
    navigation.navigate(currentNavigation, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction: bridge.updateTransaction(transaction, {
        userGasLimit: BigNumber(gasLimit || 0),
      }),
    });
  }, [account, gasLimit, navigation, parentAccount, route.params, transaction]);

  return (
    <SafeAreaView style={{ flex: 1 }} forceInset={forceInset}>
      <KeyboardView
        style={[styles.body, { backgroundColor: colors.background }]}
      >
        <NavigationScrollView contentContainerStyle={styles.root}>
          <TextInput
            autoFocus
            style={[styles.textInputAS, { color: colors.darkBlue }]}
            defaultValue={gasLimit ? gasLimit.toString() : ""}
            keyboardType="numeric"
            returnKeyType="done"
            maxLength={10}
            onChangeText={setGasLimit}
            onSubmitEditing={onValidateText}
          />

          <View style={styles.flex}>
            <Button
              event="EthereumSetGasLimit"
              type="primary"
              title={t("send.summary.validateGasLimit")}
              onPress={onValidateText}
              containerStyle={styles.buttonContainer}
            />
          </View>
        </NavigationScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}

export { options, EthereumEditGasLimit as component };

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
