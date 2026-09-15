import React, { useCallback } from "react";
import { ScrollView, Switch, View } from "react-native";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getMinBondAmount, isAleoAccount } from "@ledgerhq/live-common/families/aleo/utils";
import { MIN_DELEGATOR_STAKE_MICROCREDITS } from "@ledgerhq/live-common/families/aleo/constants";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";
import SafeAreaView from "~/components/SafeAreaView";
import { Trans, useTranslation } from "~/context/Locale";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { TrackScreen } from "~/analytics";
import AmountInput from "~/screens/SendFunds/AmountInput";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import TranslatedError from "~/components/TranslatedError";
import Alert from "~/components/Alert";
import { ScreenName } from "~/const";
import { getFirstStatusError } from "../../helpers";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { AleoBondPublicFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AleoBondPublicFlowParamList, ScreenName.AleoBondPublicAmount>
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
      switchRow: { flexDirection: "row", alignItems: "center" },
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
  const unit = account.currency.units[0];
  const spendable = account.aleoResources?.transparentBalance ?? new BigNumber(0);
  const bondedBalance = account.aleoResources?.bondedBalance ?? new BigNumber(0);
  const minBondAmount = getMinBondAmount(bondedBalance);
  const isTopUp = bondedBalance.gt(0) && bondedBalance.lt(MIN_DELEGATOR_STAKE_MICROCREDITS);

  const bridge = useAccountBridge<AleoTransaction>(account, parentAccount);

  const { transaction, setTransaction, status, bridgePending, bridgeError } = useBridgeTransaction(
    bridge,
    () => {
      const created = bridge.createTransaction(mainAccount);
      // The withdrawal address is always the account itself and is never offered as a choice.
      const prepared = bridge.updateTransaction(created, {
        mode: "bond_public",
        recipient: route.params.validatorAddress,
        withdrawal: mainAccount.freshAddress,
      });

      return {
        account,
        parentAccount: parentAccount ?? undefined,
        transaction: prepared,
      };
    },
  );

  const effectiveSpendable = spendable.minus(status.estimatedFees);
  const belowMinimum = effectiveSpendable.lt(minBondAmount);

  const onChange = useCallback(
    (amount: BigNumber) => {
      if (!transaction || amount.isNaN()) return;
      setTransaction(bridge.updateTransaction(transaction, { amount, useAllAmount: false }));
    },
    [bridge, setTransaction, transaction],
  );

  const toggleUseAllAmount = useCallback(() => {
    if (!transaction) return;
    setTransaction(
      bridge.updateTransaction(transaction, {
        amount: new BigNumber(0),
        useAllAmount: !transaction.useAllAmount,
      }),
    );
  }, [bridge, setTransaction, transaction]);

  const onChangeValidator = useCallback(() => {
    navigation.navigate(ScreenName.AleoBondPublicSelectValidator, {
      accountId: route.params.accountId,
      parentId: route.params.parentId,
      validatorAddress: route.params.validatorAddress,
      source: route.params.source,
    });
  }, [navigation, route.params]);

  const onContinue = useCallback(() => {
    if (!transaction) return;
    navigation.navigate(ScreenName.AleoBondPublicSelectDevice, {
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
  // A recipient problem (already bonded elsewhere, closed/unbonding validator) is real
  // regardless of the amount typed, so it is never suppressed by an untouched screen.
  const recipientError = status.errors.recipient;
  const showChangeValidator = !!recipientError;
  const untouchedAmount = amount.eq(0) && !useAllAmount;
  const amountError =
    untouchedAmount || bridgePending ? null : getFirstStatusError(status, "errors");
  const error = recipientError ?? amountError;
  const warning = getFirstStatusError(status, "warnings");
  const continueDisabled =
    bridgePending || !!bridgeError || amount.eq(0) || Object.keys(status.errors).length > 0;

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <TrackScreen
        category="BondPublicFlow"
        name="Amount"
        flow="stake"
        action="bond"
        currency="aleo"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.alert}>
          <Alert type="hint">
            <Trans
              i18nKey="aleo.bond.amount.stakingAlert"
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
        {belowMinimum && (
          <View style={styles.alert}>
            <Alert type="warning">
              <Trans
                i18nKey="aleo.bond.amount.belowMinimum"
                components={{
                  missing: (
                    <CurrencyUnitValue
                      unit={unit}
                      value={minBondAmount.minus(effectiveSpendable)}
                      showCode
                    />
                  ),
                  minimum: <CurrencyUnitValue unit={unit} value={minBondAmount} showCode />,
                }}
              />
            </Alert>
          </View>
        )}
        <View style={styles.amountInputHeightGuard}>
          <AmountInput
            account={account}
            value={amount}
            onChange={onChange}
            editable={!useAllAmount}
            error={error}
            warning={warning}
            testID="aleo-bond-amount-input"
          />
        </View>
        {showChangeValidator && (
          <Button
            appearance="gray"
            size="lg"
            isFull
            onPress={onChangeValidator}
            testID="aleo-bond-change-validator"
          >
            {t("aleo.bond.amount.changeValidator")}
          </Button>
        )}
        <View style={styles.spacer} />
        <View style={styles.details}>
          <View style={styles.detailsRow}>
            <Text typography="body3" lx={{ color: "muted" }}>
              <Trans i18nKey="aleo.bond.amount.available" />{" "}
              <CurrencyUnitValue unit={unit} value={spendable} showCode />
            </Text>
            <View style={styles.switchRow}>
              <Text typography="body3" lx={{ color: "muted", marginRight: "s8" }}>
                <Trans i18nKey="aleo.bond.amount.max" />
              </Text>
              <Switch
                value={!!useAllAmount}
                onValueChange={toggleUseAllAmount}
                disabled={bridgePending}
                accessibilityLabel={t("aleo.bond.amount.max")}
                accessibilityState={{ disabled: bridgePending }}
                testID="aleo-bond-use-all-amount"
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
          {isTopUp ? (
            <View>
              <Text typography="body3" lx={{ color: "muted" }}>
                <Trans
                  i18nKey="aleo.bond.amount.minimumTopUp"
                  components={{
                    missing: <CurrencyUnitValue unit={unit} value={minBondAmount} showCode />,
                    total: (
                      <CurrencyUnitValue
                        unit={unit}
                        value={new BigNumber(MIN_DELEGATOR_STAKE_MICROCREDITS)}
                        showCode
                      />
                    ),
                  }}
                />
              </Text>
            </View>
          ) : (
            <View style={styles.detailsRow}>
              <Text typography="body3" lx={{ color: "muted" }}>
                <Trans i18nKey="aleo.bond.amount.minimumLabel" />
              </Text>
              <Text
                typography="body3SemiBold"
                lx={{ color: "base" }}
                testID="aleo-bond-minimum-value"
              >
                <CurrencyUnitValue unit={unit} value={minBondAmount} showCode />
              </Text>
            </View>
          )}
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
          testID="aleo-bond-amount-continue"
        >
          {t("common.continue")}
        </Button>
      </View>
    </SafeAreaView>
  );
}
