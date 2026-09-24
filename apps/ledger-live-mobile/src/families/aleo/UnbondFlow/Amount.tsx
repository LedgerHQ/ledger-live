import React, { useCallback } from "react";
import { ScrollView, View } from "react-native";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { useTheme } from "styled-components/native";
import { Switch, Text } from "@ledgerhq/native-ui";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { isAleoAccount } from "@ledgerhq/live-common/families/aleo/utils";
import {
  MIN_DELEGATOR_STAKE_MICROCREDITS,
  TRANSACTION_TYPE,
} from "@ledgerhq/live-common/families/aleo/constants";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";
import SafeAreaView from "~/components/SafeAreaView";
import { Trans } from "~/context/Locale";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { TrackScreen } from "~/analytics";
import AmountInput from "~/screens/SendFunds/AmountInput";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Alert from "~/components/Alert";
import { ScreenName } from "~/const";
import { getFirstStatusError } from "../../helpers";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { amountStyles as styles } from "../shared/amountStyles";
import AmountContinueFooter from "../shared/AmountContinueFooter";
import type { AleoUnbondFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AleoUnbondFlowParamList, ScreenName.AleoUnbondAmount>
>;

export default function Amount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useAccountScreen(route);

  invariant(
    account && isAleoAccount(account) && account.type === "Account",
    "aleo account required",
  );

  const mainAccount = getMainAccount(account, parentAccount ?? null);
  const unit = useAccountUnit(account);
  const bondedBalance = account.aleoResources?.bondedBalance ?? new BigNumber(0);

  const bridge = useAccountBridge<AleoTransaction>(account, parentAccount);

  const { transaction, updateTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(bridge, () => {
      const created = bridge.createTransaction(mainAccount);
      const prepared = bridge.updateTransaction(created, {
        mode: TRANSACTION_TYPE.UNBOND_PUBLIC,
      });

      return {
        account,
        parentAccount: parentAccount ?? undefined,
        transaction: prepared,
      };
    });

  const onChange = useCallback(
    (amount: BigNumber) => {
      if (amount.isNaN()) return;
      updateTransaction(prev => bridge.updateTransaction(prev, { amount, useAllAmount: false }));
    },
    [bridge, updateTransaction],
  );

  const setUseAllAmount = useCallback(
    (useAllAmount: boolean) => {
      updateTransaction(prev =>
        bridge.updateTransaction(prev, { amount: new BigNumber(0), useAllAmount }),
      );
    },
    [bridge, updateTransaction],
  );

  const onContinue = useCallback(() => {
    if (!transaction) return;
    navigation.navigate(ScreenName.AleoUnbondSelectDevice, {
      accountId: route.params.accountId,
      parentId: route.params.parentId,
      transaction,
      status,
      source: route.params.source,
    });
  }, [navigation, route.params, status, transaction]);

  if (!transaction) return null;

  const { useAllAmount } = transaction;
  const { amount } = status;
  const untouchedAmount = amount.eq(0) && !useAllAmount;
  const error = bridgePending || untouchedAmount ? null : getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");
  const continueDisabled =
    bridgePending || !!bridgeError || amount.eq(0) || Object.keys(status.errors).length > 0;

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <TrackScreen
        category="UnbondFlow"
        name="Amount"
        flow="unbond"
        action="unbonding"
        currency="aleo"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.alert}>
          <Alert type="hint" testID="aleo-unbond-below-minimum-alert">
            <Trans
              i18nKey="aleo.unbond.amount.belowMinimum"
              components={{
                minimum: (
                  <CurrencyUnitValue
                    unit={unit}
                    value={new BigNumber(MIN_DELEGATOR_STAKE_MICROCREDITS)}
                    showCode
                  />
                ),
              }}
            />
          </Alert>
        </View>
        <View style={styles.amountInputHeightGuard}>
          <AmountInput
            account={account}
            value={amount}
            onChange={onChange}
            editable={!useAllAmount}
            error={error}
            warning={warning}
            testID="aleo-unbond-amount-input"
          />
        </View>
        <View style={styles.spacer} />
        <View style={[styles.details, { borderTopColor: colors.neutral.c30 }]}>
          <View style={styles.detailsRow}>
            <Text variant="small" color="neutral.c70">
              <Trans i18nKey="aleo.unbond.amount.bondedAmount" />{" "}
              <Text
                variant="small"
                fontWeight="semiBold"
                color="neutral.c100"
                testID="aleo-unbond-amount-value"
              >
                <CurrencyUnitValue unit={unit} value={bondedBalance} showCode />
              </Text>
            </Text>
            <View style={styles.switchRow}>
              <Text variant="small" color="neutral.c70" mr={3}>
                <Trans i18nKey="aleo.unbond.amount.max" />
              </Text>
              <Switch
                checked={!!useAllAmount}
                onChange={setUseAllAmount}
                disabled={bridgePending}
                testID="aleo-unbond-use-all-amount"
              />
            </View>
          </View>
          <View style={styles.detailsRow}>
            <Text variant="small" color="neutral.c70">
              <Trans i18nKey="send.summary.fees" />
            </Text>
            <Text variant="small" fontWeight="semiBold" color="neutral.c100">
              {bridgePending ? (
                "-"
              ) : (
                <CurrencyUnitValue unit={unit} value={status.estimatedFees} showCode />
              )}
            </Text>
          </View>
        </View>
      </ScrollView>
      <AmountContinueFooter
        bridgeError={bridgeError}
        onContinue={onContinue}
        disabled={continueDisabled}
        pending={bridgePending}
        testID="aleo-unbond-amount-continue"
      />
    </SafeAreaView>
  );
}
