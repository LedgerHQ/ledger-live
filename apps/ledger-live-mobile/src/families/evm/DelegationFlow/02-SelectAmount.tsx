/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import {
  getMaxEstimatedBalance,
  getUnbondingPeriodDays,
  hasUnbondingPeriod,
  isSeiAccountUnassociated,
} from "@ledgerhq/live-common/families/evm/staking/logic";
import { isStakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import type { TransactionStatus } from "@ledgerhq/coin-evm/types/index";
import { Alert, Flex, Text } from "@ledgerhq/native-ui";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { useTheme } from "styled-components/native";
import {
  SafeAreaView,
  Keyboard,
  KeyboardAvoidingViewProps,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Trans, useTranslation } from "~/context/Locale";
import Button from "~/components/Button";
import CurrencyInput from "~/components/CurrencyInput";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import KeyboardView from "~/components/KeyboardView";
import LText from "~/components/LText";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import Warning from "~/icons/Warning";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useSettings } from "~/hooks";
import type { EvmDelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<EvmDelegationFlowParamList, ScreenName.EvmDelegationAmount>;

export default function SelectAmount({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account } = useAccountScreen(route);
  const { locale } = useSettings();
  const { colors } = useTheme();

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");
  invariant(isStakingAccount(account), "evm staking account required");

  const bridge = useAccountBridge<GenericTransaction>(account);
  const unit = useAccountUnit(account);
  const { transaction, setTransaction, status, bridgePending, bridgeError } = useBridgeTransaction(
    bridge,
    () => ({
      account,
      parentAccount: undefined,
      transaction: route.params.transaction,
    }),
  );

  invariant(transaction, "transaction required");
  const evmTransaction = transaction as unknown as GenericTransaction;

  const totalFees = useMemo(
    () => (status as TransactionStatus).totalFees ?? status.estimatedFees ?? new BigNumber(0),
    [status],
  );
  const maxSpendable = useMemo(
    () => getMaxEstimatedBalance(account, totalFees),
    [account, totalFees],
  );
  const amount = evmTransaction.amount ?? new BigNumber(0);
  const remaining = maxSpendable.minus(amount);
  const hasErrors = Object.keys(status.errors).length > 0;
  const firstError = Object.values(status.errors)[0];
  const firstErrorMessage = firstError instanceof Error ? firstError.message : undefined;
  const canContinue =
    !bridgePending && !bridgeError && !hasErrors && amount.gt(0) && maxSpendable.gte(amount);
  const showLockUpWarning = hasUnbondingPeriod(account.currency.id);
  const showSeiAssociationWarning = useMemo(
    () => isSeiAccountUnassociated(account.currency.id, account.freshAddress, account.operations),
    [account],
  );

  const updateAmount = useCallback(
    (amount: BigNumber, useAllAmount = false) => {
      setTransaction(
        bridge.updateTransaction(evmTransaction, {
          amount,
          useAllAmount,
        }) as unknown as Transaction,
      );
    },
    [bridge, evmTransaction, setTransaction],
  );

  const onUseMax = useCallback(() => {
    Keyboard.dismiss();
    updateAmount(maxSpendable, true);
  }, [maxSpendable, updateAmount]);

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.EvmDelegationSelectDevice, {
      ...route.params,
      transaction,
      status: status as TransactionStatus,
      validatorName: route.params.validator.name,
    });
  }, [navigation, route.params, status, transaction]);

  let behaviorParam: KeyboardAvoidingViewProps["behavior"] | undefined;
  if (Platform.OS === "ios") {
    behaviorParam = "padding";
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background.main }]}>
      <KeyboardView behavior={behaviorParam}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.main}>
              <CurrencyInput
                unit={unit}
                value={amount}
                onChange={value => updateAmount(value)}
                inputStyle={styles.inputStyle}
                hasError={hasErrors || maxSpendable.lt(amount)}
                testID="evm-delegation-amount-input"
              />
              <TouchableOpacity
                style={styles.maxButton}
                onPress={onUseMax}
                testID="evm-delegation-use-max"
              >
                <Text variant="body" fontWeight="semiBold" color="primary.c80">
                  <Trans i18nKey="send.amount.useMax" />
                </Text>
              </TouchableOpacity>
            </View>

            {showSeiAssociationWarning ? (
              <View style={styles.alertContainer}>
                <Alert
                  type="warning"
                  title={t("evm.delegation.flow.steps.starter.seiAssociationWarning")}
                />
              </View>
            ) : null}
            <View style={styles.footer}>
              {showLockUpWarning ? (
                <View style={styles.alertContainer}>
                  <Alert
                    type="info"
                    title={t("cosmos.delegation.flow.steps.starter.steps.1", {
                      numberOfDays: getUnbondingPeriodDays(account.currency.id),
                    })}
                  />
                </View>
              ) : null}
              <SummaryRow title={<Trans i18nKey="account.availableBalance" />}>
                <LText semiBold>
                  <CurrencyUnitValue unit={unit} value={maxSpendable} showCode />
                </LText>
              </SummaryRow>
              <SummaryRow title={<Trans i18nKey="send.summary.maxEstimatedFee" />}>
                <LText semiBold>
                  <CurrencyUnitValue unit={unit} value={totalFees} showCode />
                </LText>
              </SummaryRow>
              {!bridgePending && !hasErrors && remaining.gte(0) ? (
                <Flex mb={6}>
                  <Text variant="small" color="neutral.c70" textAlign="center">
                    <Trans
                      i18nKey="cosmos.delegation.flow.steps.amount.assetsRemaining"
                      values={{
                        amount: formatCurrencyUnit(unit, remaining, {
                          showCode: true,
                          locale,
                        }),
                      }}
                    >
                      <LText semiBold>{""}</LText>
                    </Trans>
                  </Text>
                </Flex>
              ) : null}
              {firstErrorMessage ? (
                <View style={styles.errorContainer}>
                  <Warning size={16} color={colors.error.c50} />
                  <LText style={styles.errorText} color="red">
                    {firstErrorMessage}
                  </LText>
                </View>
              ) : null}
              <Button
                disabled={!canContinue}
                pending={bridgePending}
                event="Evm DelegationAmountContinueBtn"
                onPress={onContinue}
                title={<Trans i18nKey="common.continue" />}
                type="primary"
                testID="evm-delegation-amount-continue"
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "stretch",
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  inputStyle: {
    textAlign: "center",
    fontSize: 40,
    fontWeight: "600",
  },
  maxButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  footer: {
    alignSelf: "stretch",
    padding: 8,
  },
  alertContainer: {
    marginBottom: 24,
  },
  errorContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 10,
  },
});
