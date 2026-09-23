import React, { useCallback } from "react";
import { ScrollView, View } from "react-native";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { Button, Switch, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { isAleoAccount } from "@ledgerhq/live-common/families/aleo/utils";
import { useAleoStakingPosition } from "@ledgerhq/live-common/families/aleo/react";
import {
  MIN_DELEGATOR_STAKE_MICROCREDITS,
  TRANSACTION_TYPE,
} from "@ledgerhq/live-common/families/aleo/constants";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";
import SafeAreaView from "~/components/SafeAreaView";
import Skeleton from "~/components/Skeleton";
import { Trans, useTranslation } from "~/context/Locale";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { TrackScreen } from "~/analytics";
import AmountInput from "~/screens/SendFunds/AmountInput";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import TranslatedError from "~/components/TranslatedError";
import Alert from "~/components/Alert";
import { ScreenName } from "~/const";
import { getFirstStatusError } from "../../helpers";
import { getValidatorLabel } from "../Staking/utils";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { AleoUnbondFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AleoUnbondFlowParamList, ScreenName.AleoUnbondAmount>
>;

export default function Amount({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account, parentAccount } = useAccountScreen(route);
  const styles = useStyleSheet(
    theme => ({
      root: {
        flex: 1,
      },
      scroll: {
        flex: 1,
      },
      content: {
        flexGrow: 1,
        paddingHorizontal: theme.spacings.s24,
        paddingTop: theme.spacings.s16,
      },
      alert: {
        marginBottom: theme.spacings.s16,
      },
      amountInputHeightGuard: {
        flexShrink: 1,
        minHeight: 160,
      },
      spacer: {
        flexGrow: 1,
      },
      details: {
        marginVertical: theme.spacings.s16,
        paddingTop: theme.spacings.s12,
        borderTopWidth: theme.borderWidth.s1,
        borderTopColor: theme.colors.border.mutedSubtle,
        gap: theme.spacings.s8,
      },
      detailsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      },
      validatorRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.spacings.s8,
      },
      validatorLabel: {
        flexShrink: 0,
      },
      validatorValue: {
        flex: 1,
        textAlign: "right",
      },
      validatorSkeleton: {
        width: 96,
        height: 16,
        borderRadius: 4,
      },
      switchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacings.s8,
      },
      footer: {
        paddingHorizontal: theme.spacings.s16,
        paddingBottom: theme.spacings.s16,
        paddingTop: theme.spacings.s8,
      },
    }),
    [],
  );

  invariant(
    account && isAleoAccount(account) && account.type === "Account",
    "aleo account required",
  );

  const mainAccount = getMainAccount(account, parentAccount ?? null);
  const unit = useAccountUnit(account);
  const bondedBalance = account.aleoResources?.bondedBalance ?? new BigNumber(0);
  const position = useAleoStakingPosition(account);

  const bridge = useAccountBridge<AleoTransaction>(account, parentAccount);

  const { transaction, updateTransaction, status, bridgePending, bridgeError } =
    useBridgeTransaction(bridge, () => {
      const created = bridge.createTransaction(mainAccount);
      const prepared = bridge.updateTransaction(created, {
        mode: TRANSACTION_TYPE.UNBOND_PUBLIC,
        useAllAmount: true,
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
        {(error || warning) && (
          <View style={styles.alert}>
            <Alert type={error ? "error" : "warning"} testID="aleo-unbond-status-alert">
              <TranslatedError error={error ?? warning} field="description" />
            </Alert>
          </View>
        )}
        <View style={styles.amountInputHeightGuard}>
          <AmountInput
            account={account}
            value={amount}
            onChange={onChange}
            editable={!useAllAmount}
            testID="aleo-unbond-amount-input"
          />
        </View>
        <View style={styles.spacer} />
        <View style={styles.details}>
          <View style={styles.validatorRow}>
            <Text typography="body3" lx={{ color: "muted" }} style={styles.validatorLabel}>
              <Trans i18nKey="aleo.unbond.amount.validator" />
            </Text>
            <Skeleton loading={position.validatorsLoading} style={styles.validatorSkeleton}>
              <Text
                typography="body3SemiBold"
                lx={{ color: "base" }}
                style={styles.validatorValue}
                testID="aleo-unbond-amount-validator"
              >
                {getValidatorLabel(t, position)}
              </Text>
            </Skeleton>
          </View>
          <View style={styles.detailsRow}>
            <Text typography="body3" lx={{ color: "muted" }}>
              <Trans i18nKey="aleo.unbond.amount.bondedAmount" />{" "}
              <Text
                typography="body3SemiBold"
                lx={{ color: "base" }}
                testID="aleo-unbond-amount-value"
              >
                <CurrencyUnitValue unit={unit} value={bondedBalance} showCode />
              </Text>
            </Text>
            <View style={styles.switchRow}>
              <Text typography="body3" lx={{ color: "muted" }}>
                <Trans i18nKey="aleo.unbond.amount.max" />
              </Text>
              <Switch
                checked={!!useAllAmount}
                onCheckedChange={setUseAllAmount}
                disabled={bridgePending}
                testID="aleo-unbond-use-all-amount"
              />
            </View>
          </View>
          <View style={styles.detailsRow}>
            <Text typography="body3" lx={{ color: "muted" }}>
              <Trans i18nKey="send.summary.fees" />
            </Text>
            <Text typography="body3SemiBold" lx={{ color: "base" }}>
              {bridgePending ? (
                "-"
              ) : (
                <CurrencyUnitValue unit={unit} value={status.estimatedFees} showCode />
              )}
            </Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        {bridgeError && (
          <Text typography="body3" lx={{ color: "error", textAlign: "center", marginBottom: "s8" }}>
            <TranslatedError error={bridgeError} />
          </Text>
        )}
        <Button
          appearance="base"
          size="lg"
          isFull
          onPress={onContinue}
          disabled={continueDisabled}
          loading={bridgePending}
          testID="aleo-unbond-amount-continue"
        >
          {t("common.continue")}
        </Button>
      </View>
    </SafeAreaView>
  );
}
