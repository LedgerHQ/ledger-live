import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useState, useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Keyboard, StyleSheet, View, SafeAreaView, ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useSelector } from "react-redux";
import Button from "~/components/Button";
import KeyboardView from "~/components/KeyboardView";
import LText from "~/components/LText";
import { accountScreenSelector } from "~/reducers/accounts";
import CurrencyInput from "~/components/CurrencyInput";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "~/const";
import { SignTransactionNavigatorParamList } from "~/components/RootNavigator/types/SignTransactionNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";

const options = {
  title: <Trans i18nKey="send.summary.fees" />,
  headerLeft: undefined,
};

type NavigationProps = BaseComposite<
  | StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.StellarEditCustomFees>
  | StackNavigatorProps<SignTransactionNavigatorParamList, ScreenName.StellarEditCustomFees>
  | StackNavigatorProps<SwapNavigatorParamList, ScreenName.StellarEditCustomFees>
>;

function StellarEditCustomFees({ navigation, route }: NavigationProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { transaction } = route.params;
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(transaction.family === "stellar", "not stellar family");
  invariant(account, "no account found");
  const mainAccount = getMainAccount(account, parentAccount);
  const { networkCongestionLevel } = transaction?.networkInfo || {};
  const [customFee, setCustomFee] = useState(transaction.fees);

  const onChange = (fee: BigNumber) => {
    setCustomFee(fee);
  };

  const onSubmit = useCallback(() => {
    Keyboard.dismiss();
    setCustomFee(BigNumber(customFee || 0));
    const bridge = getAccountBridge(account, parentAccount);
    const { currentNavigation } = route.params;
    // @ts-expect-error ask your mom about it
    navigation.navigate(currentNavigation, {
      ...route.params,
      accountId: account.id,
      transaction: bridge.updateTransaction(transaction, {
        fees: BigNumber(customFee || 0),
      }),
    });
  }, [customFee, account, parentAccount, route.params, navigation, transaction]);
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
          <View style={styles.inputBox}>
            <View style={styles.feeWrapper}>
              <CurrencyInput
                editable
                isActive
                onChange={onChange}
                unit={mainAccount.unit}
                value={customFee}
                renderRight={
                  <LText style={[styles.currency, styles.active]} semiBold color="grey">
                    {mainAccount.unit.code}
                  </LText>
                }
              />
            </View>
          </View>

          {networkCongestionLevel ? (
            <View style={styles.congestionNote}>
              <LText style={styles.congestionNoteText} color="grey">
                {`${t(`stellar.networkCongestionLevel.${networkCongestionLevel}`)} ${t(
                  "stellar.networkCongestion",
                )}`}
              </LText>
            </View>
          ) : null}

          <View style={styles.bottomButton}>
            <Button
              event="StellarSetCustomFee"
              type="primary"
              title={t("common.continue")}
              onPress={onSubmit}
              containerStyle={styles.buttonContainer}
              disabled={BigNumber(customFee || 0).isZero()}
            />
          </View>
        </ScrollView>
      </KeyboardView>
    </SafeAreaView>
  );
}

export { options, StellarEditCustomFees as component };
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  bottomButton: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  feeWrapper: {
    flex: 1,
    flexBasis: 100,
    flexShrink: 0,
    flexDirection: "column",
    justifyContent: "center",
  },
  congestionNote: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  congestionNoteText: {
    fontSize: 14,
  },
  active: {
    fontSize: 32,
  },
});
