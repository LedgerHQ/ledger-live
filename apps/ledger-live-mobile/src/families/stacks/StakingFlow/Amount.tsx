import React, { useCallback } from "react";
import { ScrollView, View } from "react-native";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { useIsFocused } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { Button, Text } from "@ledgerhq/native-ui";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { isStacksAccount } from "@ledgerhq/live-common/families/stacks/types";
import type { Transaction as StacksTransaction } from "@ledgerhq/live-common/families/stacks/types";
import SafeAreaView from "~/components/SafeAreaView";
import { Trans, useTranslation } from "~/context/Locale";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { TrackScreen } from "@shared/analytics-react";
import AmountInput from "~/screens/SendFunds/AmountInput";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Alert from "~/components/Alert";
import TranslatedError from "~/components/TranslatedError";
import { ScreenName } from "~/const";
import { getFirstStatusError } from "../../helpers";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { stacksFlowStyles as styles } from "../shared/styles";
import ContinueFooter from "../shared/ContinueFooter";
import { useRetry } from "../shared/useRetry";
import type { StacksStakingFlowParamList } from "./types";
import { useStartBurnHtRefresh } from "./useStartBurnHtRefresh";

type Props = BaseComposite<
  StackNavigatorProps<StacksStakingFlowParamList, ScreenName.StacksStakingAmount>
>;

export default function Amount({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const { account, parentAccount } = useAccountScreen(route);

  invariant(account?.type === "Account" && isStacksAccount(account), "stacks account required");

  const unit = useAccountUnit(account);
  const { valAddress, numCycles } = route.params;

  const bridge = useAccountBridge<StacksTransaction>(account, parentAccount);

  const { transaction, updateTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(bridge, () => {
      const created = bridge.createTransaction(account);
      const prepared = bridge.updateTransaction(created, {
        mode: "delegate",
        valAddress,
        familySpecificData: { numCycles },
      });
      return { account, transaction: prepared };
    });

  const onStartBurnHtResolved = useCallback(
    (startBurnHt: number) =>
      updateTransaction(prev =>
        bridge.updateTransaction(prev, {
          familySpecificData: { ...prev.familySpecificData, startBurnHt },
        }),
      ),
    [bridge, updateTransaction],
  );
  // StacksStakingSelectDevice takes over the refresh once Continue hands it the snapshot.
  const { poxError, retry: resolveStartBurnHt } = useStartBurnHtRefresh(
    isFocused,
    onStartBurnHtResolved,
  );
  // On the generic bridge, validateIntent makes its own /v2/pox request, and a failure there
  // surfaces as `bridgeError` (which the bridge keeps pending while it retries on its own), not as
  // `poxError`. Refreshing the height hands the bridge a new transaction, so one Retry covers both.
  const preparationError = poxError || bridgeError;
  const { retrying, retry } = useRetry(preparationError, resolveStartBurnHt);

  const onChange = useCallback(
    (amount: BigNumber) => {
      if (amount.isNaN()) return;
      updateTransaction(prev => bridge.updateTransaction(prev, { amount }));
    },
    [bridge, updateTransaction],
  );

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.StacksStakingSelectDevice, {
      accountId: route.params.accountId,
      parentId: route.params.parentId,
      transaction: transaction as StacksTransaction,
      status,
      source: route.params.source,
    });
  }, [navigation, route.params, status, transaction]);

  if (!transaction) return null;

  const startBurnHtResolved = transaction.familySpecificData?.startBurnHt !== undefined;
  const feeResolved = !!(transaction.fee || transaction.fees);
  const { amount } = status;
  const untouchedAmount = amount.eq(0);
  const amountError =
    untouchedAmount || bridgePending || !startBurnHtResolved
      ? null
      : getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");
  const continueDisabled =
    bridgePending ||
    !!bridgeError ||
    !!poxError ||
    !startBurnHtResolved ||
    !feeResolved ||
    amount.eq(0) ||
    Object.keys(status.errors).length > 0;

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <TrackScreen
        category="StacksStakingFlow"
        name="Amount"
        flow="stake"
        action="delegate"
        currency="stx"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.alert}>
          <Alert type="hint">
            <Trans i18nKey="stacks.stake.amount.disclaimer" />
          </Alert>
        </View>
        {preparationError ? (
          <View style={styles.alert} testID="stacks-stake-amount-error">
            <Alert type="error">
              <TranslatedError error={preparationError} />
            </Alert>
            <Button
              mt={4}
              outline
              type="main"
              size="large"
              onPress={retry}
              pending={retrying}
              disabled={retrying}
              testID="stacks-stake-amount-retry"
            >
              {t("common.retry")}
            </Button>
          </View>
        ) : null}
        <View style={styles.amountInputHeightGuard}>
          <AmountInput
            account={account}
            value={amount}
            onChange={onChange}
            error={amountError}
            warning={warning}
            testID="stacks-stake-amount-input"
          />
        </View>
        <View style={styles.spacer} />
        <View style={[styles.details, { borderTopColor: colors.neutral.c30 }]}>
          <View style={styles.detailsRow}>
            <Text variant="small" color="neutral.c70">
              <Trans i18nKey="stacks.stake.amount.pool" />
            </Text>
            <Text
              variant="small"
              fontWeight="semiBold"
              color="neutral.c100"
              testID="stacks-stake-pool-value"
            >
              {shortAddressPreview(valAddress)}
            </Text>
          </View>
          <View style={styles.detailsRow}>
            <Text variant="small" color="neutral.c70">
              <Trans i18nKey="stacks.stake.amount.numCycles" />
            </Text>
            <Text
              variant="small"
              fontWeight="semiBold"
              color="neutral.c100"
              testID="stacks-stake-num-cycles-value"
            >
              {numCycles}
            </Text>
          </View>
          <View style={styles.detailsRow}>
            <Text variant="small" color="neutral.c70">
              <Trans i18nKey="stacks.stake.amount.available" />
            </Text>
            <Text variant="small" fontWeight="semiBold" color="neutral.c100">
              <CurrencyUnitValue unit={unit} value={account.spendableBalance} showCode />
            </Text>
          </View>
          <View style={styles.detailsRow}>
            <Text variant="small" color="neutral.c70">
              <Trans i18nKey="send.summary.fees" />
            </Text>
            <Text variant="small" fontWeight="semiBold" color="neutral.c100">
              {bridgePending || !feeResolved ? (
                "-"
              ) : (
                <CurrencyUnitValue unit={unit} value={status.estimatedFees} showCode />
              )}
            </Text>
          </View>
        </View>
      </ScrollView>
      <ContinueFooter
        // Already shown, with its Retry, in the alert above.
        bridgeError={null}
        onContinue={onContinue}
        disabled={continueDisabled}
        pending={bridgePending || (!startBurnHtResolved && !poxError)}
        testID="stacks-stake-amount-continue"
      />
    </SafeAreaView>
  );
}
