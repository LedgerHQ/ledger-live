import React, { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import invariant from "invariant";
import { useTheme } from "styled-components/native";
import { Button, Text } from "@ledgerhq/native-ui";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import {
  getStacksStakingPosition,
  getStacksUnlockCycle,
} from "@ledgerhq/live-common/families/stacks/react";
import { isStacksAccount } from "@ledgerhq/live-common/families/stacks/types";
import type { Transaction as StacksTransaction } from "@ledgerhq/live-common/families/stacks/types";
import SafeAreaView from "~/components/SafeAreaView";
import { Trans, useTranslation } from "~/context/Locale";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { TrackScreen } from "@shared/analytics-react";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Alert from "~/components/Alert";
import TranslatedError from "~/components/TranslatedError";
import { ScreenName } from "~/const";
import { getFirstStatusError } from "../../helpers";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { stacksFlowStyles as styles } from "../shared/styles";
import ContinueFooter from "../shared/ContinueFooter";
import type { StacksUnstakingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<StacksUnstakingFlowParamList, ScreenName.StacksUnstakingSummary>
>;

export default function Summary({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { account, parentAccount } = useAccountScreen(route);

  invariant(
    account && account.type === "Account" && isStacksAccount(account),
    "stacks account required",
  );

  const unit = useAccountUnit(account);
  const position = getStacksStakingPosition(account);
  const unlockCycle = position ? getStacksUnlockCycle(position) : undefined;
  // Captured at mount: the post-broadcast sync can drop the position while this screen is stacked.
  const [delegate] = useState(position?.delegate);

  const bridge = useAccountBridge<StacksTransaction>(account, parentAccount);

  const { transaction, updateTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(bridge, () => {
      const created = bridge.createTransaction(account);
      const prepared = bridge.updateTransaction(created, {
        mode: "undelegate",
        valAddress: delegate,
      });
      return { account, transaction: prepared };
    });

  const retryPreparation = useCallback(() => {
    updateTransaction(prev => ({ ...prev }));
  }, [updateTransaction]);

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.StacksUnstakingSelectDevice, {
      accountId: route.params.accountId,
      parentId: route.params.parentId,
      transaction: transaction as StacksTransaction,
      status,
      source: route.params.source,
    });
  }, [navigation, route.params, status, transaction]);

  if (!transaction) return null;

  if (!delegate) {
    return (
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <View style={styles.content} testID="stacks-unstake-no-position">
          <Alert type="warning">
            <Trans i18nKey="stacks.unstake.summary.noPosition" />
          </Alert>
        </View>
      </SafeAreaView>
    );
  }

  const feeResolved = !!(transaction.fee || transaction.fees);
  const error = bridgePending ? null : getFirstStatusError(status, "errors");
  const continueDisabled =
    bridgePending || !!bridgeError || !feeResolved || Object.keys(status.errors).length > 0;

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <TrackScreen
        category="StacksUnstakingFlow"
        name="Summary"
        flow="stake"
        action="undelegate"
        currency="stx"
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.alert}>
          <Alert type="hint">
            <Trans i18nKey="stacks.unstake.summary.info" />
          </Alert>
        </View>
        {error ? (
          <View style={styles.alert}>
            <Alert type="error">
              <TranslatedError error={error} />
            </Alert>
          </View>
        ) : null}
        <View style={[styles.details, { borderTopColor: colors.neutral.c30 }]}>
          <View style={styles.detailsRow}>
            <Text variant="small" color="neutral.c70">
              <Trans i18nKey="stacks.unstake.summary.pool" />
            </Text>
            <Text
              variant="small"
              fontWeight="semiBold"
              color="neutral.c100"
              testID="stacks-unstake-pool-value"
            >
              {shortAddressPreview(delegate)}
            </Text>
          </View>
          {position ? (
            <>
              <View style={styles.detailsRow}>
                <Text variant="small" color="neutral.c70">
                  <Trans i18nKey="stacks.account.staked" />
                </Text>
                <Text
                  variant="small"
                  fontWeight="semiBold"
                  color="neutral.c100"
                  testID="stacks-unstake-staked-value"
                >
                  <CurrencyUnitValue unit={unit} value={position.amount} showCode />
                </Text>
              </View>
              {unlockCycle === undefined ? null : (
                <View style={styles.detailsRow}>
                  <Text variant="small" color="neutral.c70">
                    <Trans i18nKey="stacks.account.unlockCycle" />
                  </Text>
                  <Text
                    variant="small"
                    fontWeight="semiBold"
                    color="neutral.c100"
                    testID="stacks-unstake-unlock-cycle-value"
                  >
                    {unlockCycle}
                  </Text>
                </View>
              )}
            </>
          ) : null}
          <View style={styles.detailsRow}>
            <Text variant="small" color="neutral.c70">
              <Trans i18nKey="send.summary.fees" />
            </Text>
            <Text
              variant="small"
              fontWeight="semiBold"
              color="neutral.c100"
              testID="stacks-unstake-fees-value"
            >
              {bridgePending || !feeResolved ? (
                "-"
              ) : (
                <CurrencyUnitValue unit={unit} value={status.estimatedFees} showCode />
              )}
            </Text>
          </View>
        </View>
        {/* A settled preparation with no fee is reported through status.errors, not bridgeError
            (the classic bridge's case), so both are retryable. */}
        {!bridgePending && (bridgeError || error) ? (
          <Button
            outline
            type="main"
            size="large"
            onPress={retryPreparation}
            testID="stacks-unstake-retry"
          >
            {t("common.retry")}
          </Button>
        ) : null}
      </ScrollView>
      <ContinueFooter
        bridgeError={bridgeError}
        onContinue={onContinue}
        disabled={continueDisabled}
        pending={bridgePending}
        testID="stacks-unstake-summary-continue"
      />
    </SafeAreaView>
  );
}
