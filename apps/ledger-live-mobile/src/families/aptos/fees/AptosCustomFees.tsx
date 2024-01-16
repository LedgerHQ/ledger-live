import invariant from "invariant";
import React, { useCallback, useRef, useMemo } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { useTranslation, Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useTheme as useThemeStyled } from "styled-components/native";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import BigNumber from "bignumber.js";

import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useSelector } from "react-redux";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAccountUnit, getAccountCurrency } from "@ledgerhq/live-common/account/helpers";

import KeyboardView from "../../../components/KeyboardView";
import NavigationScrollView from "../../../components/NavigationScrollView";
import SummaryRow from "../../../screens/SendFunds/SummaryRow";
import LText from "../../../components/LText";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";
import Button from "../../../components/Button";
import GasPriceField from "./GasPriceField";
import MaxGasAmountField from "./MaxGasAmountField";
import SequenceNumberField from "./SequenceNumberField";
import ExpirationTimestampField from "./ExpirationTimestampField";

import { accountScreenSelector } from "../../../reducers/accounts";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "../../../components/RootNavigator/types/SendFundsNavigator";
import { ScreenName } from "../../../const";

type AptosTransaction = Extract<Transaction, { family: "aptos" }>;

const options = {
  title: <Trans i18nKey="send.fees.aptos.options" />,
  headerLeft: null,
};

type NavigationProps = BaseComposite<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.AptosCustomFees>
>;

const AptosCustomFees = ({ navigation, route }: NavigationProps) => {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const { transaction, updateTransaction, setTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(() => ({
      transaction: route.params.transaction,
      account,
      parentAccount,
    }));

  invariant(transaction?.family === "aptos", "AptosCustomFees: aptos family expected");
  invariant(account, "Account required");
  const { theme } = useThemeStyled();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const unit = getAccountUnit(account);
  const currency = getAccountCurrency(account);

  const gasPriceFieldElement = useRef<{ resetData: () => void }>();
  const gasLimitElement = useRef<{ resetData: () => void }>();
  const sequenceNumberElement = useRef<{ resetData: () => void }>();
  const expirationTimestampElement = useRef<{ resetData: () => void }>();

  const setOptimalGas = useCallback(() => {
    gasPriceFieldElement.current?.resetData();
    gasLimitElement.current?.resetData();

    const bridge = getAccountBridge(account);
    updateTransaction((transaction: AptosTransaction) =>
      bridge.updateTransaction(transaction, {
        options: {
          ...transaction.options,
          maxGasAmount: transaction.estimate.maxGasAmount,
          gasUnitPrice: transaction.estimate.gasUnitPrice,
        },
      }),
    );
  }, [account, updateTransaction]);

  const resetSettings = useCallback(() => {
    sequenceNumberElement.current?.resetData();
    expirationTimestampElement.current?.resetData();

    const bridge = getAccountBridge(account);
    updateTransaction((transaction: AptosTransaction) =>
      bridge.updateTransaction(transaction, {
        options: {
          ...transaction.options,
          sequenceNumber: "",
          expirationTimestampSecs: "",
        },
        errors: Object.assign({}, transaction.errors, {
          sequenceNumber: "",
          expirationTimestampSecs: "",
        }),
      }),
    );
  }, [account, updateTransaction]);

  const applyChanges = useCallback(() => {
    route.params.setCustomFees({ options: transaction.options, fees: transaction.fees });
    navigation.goBack();
  }, [navigation, route, transaction]);

  const applyDisabled = useMemo(
    () => Boolean(Object.keys(status.errors).length || bridgePending || bridgeError),
    [status.errors, bridgePending, bridgeError],
  );

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardView style={{ backgroundColor: colors.background, flex: 1 }}>
        <NavigationScrollView style={styles.body}>
          <View>
            <View style={styles.feesContainer}>
              <SummaryRow title={<Trans i18nKey="send.fees.title" />}>
                <View style={styles.feesValue}>
                  <LText style={styles.valueText} semiBold>
                    <CurrencyUnitValue unit={unit} value={transaction.fees} disableRounding />
                  </LText>
                  <LText style={styles.counterValueText} color="grey" semiBold>
                    <CounterValue
                      before="≈ "
                      value={transaction.fees as BigNumber}
                      currency={currency}
                      showCode
                    />
                  </LText>
                </View>
              </SummaryRow>
              {bridgePending && (
                <View style={[styles.loader, theme === "light" && styles.loaderLight]}>
                  <ActivityIndicator size="large" />
                </View>
              )}
            </View>
            <View style={styles.group}>
              <View style={styles.inputGroup}>
                <MaxGasAmountField
                  ref={gasLimitElement}
                  transaction={transaction}
                  updateTransaction={updateTransaction}
                  setTransaction={setTransaction}
                  account={account}
                  parentAccount={parentAccount}
                  status={status}
                />
                <GasPriceField
                  ref={gasPriceFieldElement}
                  transaction={transaction}
                  updateTransaction={updateTransaction}
                  account={account}
                  parentAccount={parentAccount}
                  status={status}
                />
              </View>
              <Button
                event="AptosSetOptimalGas"
                type="primary"
                title={t("send.fees.aptos.setOptimalGas")}
                onPress={setOptimalGas}
                containerStyle={styles.button}
              />
            </View>
            <View style={styles.group}>
              <View style={styles.inputGroup}>
                <SequenceNumberField
                  ref={sequenceNumberElement}
                  transaction={transaction}
                  updateTransaction={updateTransaction}
                  account={account}
                  parentAccount={parentAccount}
                  status={status}
                />
                <ExpirationTimestampField
                  ref={expirationTimestampElement}
                  transaction={transaction}
                  updateTransaction={updateTransaction}
                  account={account}
                  parentAccount={parentAccount}
                  status={status}
                />
              </View>
              <Button
                event="AptosResetSettings"
                type="primary"
                title={t("send.fees.aptos.resetSettings")}
                onPress={resetSettings}
                containerStyle={styles.button}
              />
            </View>
          </View>
        </NavigationScrollView>
        <Button
          event="AptosApplyOptions"
          containerStyle={styles.applyButton}
          type="main"
          title={t("common.apply")}
          onPress={applyChanges}
          disabled={applyDisabled}
        />
      </KeyboardView>
    </SafeAreaView>
  );
};

export { options, AptosCustomFees as component };

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "space-between",
  },
  body: {
    paddingHorizontal: 16,
  },
  group: {
    marginBottom: 40,
  },
  inputGroup: {
    flex: 1,
    flexDirection: "row",
    gap: 14,
  },
  button: {
    marginTop: 16,
  },
  feesValue: {
    alignItems: "flex-end",
  },
  feesContainer: {
    position: "relative",
    marginBottom: 16,
  },
  valueText: {
    fontSize: 16,
  },
  counterValueText: {
    fontSize: 12,
  },
  applyButton: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  loader: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderLight: {
    backgroundColor: "rgba(255,255,255,.8)",
  },
});
