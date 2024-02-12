import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useState, useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Keyboard, StyleSheet, View, SafeAreaView } from "react-native";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useSelector } from "react-redux";
import Button from "~/components/Button";
import KeyboardView from "~/components/KeyboardView";
import NavigationScrollView from "~/components/NavigationScrollView";
import LText from "~/components/LText";
import { accountScreenSelector } from "~/reducers/accounts";
import TextInput from "~/components/FocusedTextInput";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";

const options = {
  title: <Trans i18nKey="send.summary.fees" />,
  headerLeft: undefined,
};

type Navigation = CompositeScreenProps<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.BitcoinEditCustomFees>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.BitcoinEditCustomFees>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.BitcoinEditCustomFees>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

type Props = Navigation;

function BitcoinEditCustomFees({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const satPerByte = route.params?.satPerByte;
  const setSatPerByte = route.params?.setSatPerByte;
  const { transaction } = route.params;
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(transaction.family === "bitcoin", "not bitcoin family");
  invariant(account, "no account found");
  const [ownSatPerByte, setOwnSatPerByte] = useState(satPerByte ? satPerByte.toString() : "");

  const onChange = useCallback((text: string) => {
    setOwnSatPerByte(text.replace(/\D/g, ""));
  }, []);

  const onValidateText = useCallback(() => {
    if (BigNumber(ownSatPerByte || 0).isZero()) return;
    Keyboard.dismiss();
    setSatPerByte && setSatPerByte(BigNumber(ownSatPerByte || 0));
    const bridge = getAccountBridge(account, parentAccount);
    const { currentNavigation } = route.params;
    // @ts-expect-error ask your mom about it
    navigation.navigate(currentNavigation, {
      ...route.params,
      accountId: account.id,
      transaction: bridge.updateTransaction(transaction, {
        feePerByte: BigNumber(ownSatPerByte || 0),
        feesStrategy: "custom",
      }),
    });
  }, [setSatPerByte, ownSatPerByte, account, parentAccount, route.params, navigation, transaction]);
  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
    >
      <KeyboardView
        style={[
          styles.body,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <NavigationScrollView>
          <View style={styles.inputBox}>
            <TextInput
              autoFocus
              style={[
                styles.textInputAS,
                {
                  color: colors.darkBlue,
                },
              ]}
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={10}
              onChangeText={onChange}
              onSubmitEditing={onValidateText}
              value={ownSatPerByte}
            />
            <LText
              style={[
                styles.currency,
                {
                  color: colors.grey,
                },
              ]}
            >
              <Trans i18nKey="common.satPerByte" />
            </LText>
          </View>
          <View style={styles.flex}>
            <Button
              event="BitcoinSetSatPerByte"
              type="primary"
              title={t("common.continue")}
              onPress={onValidateText}
              containerStyle={styles.buttonContainer}
              disabled={BigNumber(ownSatPerByte || 0).isZero()}
            />
          </View>
        </NavigationScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}

export { options, BitcoinEditCustomFees as component };
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inputBox: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  body: {
    flexDirection: "column",
    flex: 1,
  },
  textInputAS: {
    fontSize: 30,
  },
  currency: {
    fontSize: 20,
    padding: 6,
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
