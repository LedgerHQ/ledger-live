/* @flow */
import invariant from "invariant";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import React, { useCallback } from "react";
import { StyleSheet, View, TouchableOpacity, SafeAreaView } from "react-native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import type {
  Transaction,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { BigNumber } from "bignumber.js";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account/helpers";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../../reducers/accounts";
import { ScreenName } from "../../../../const";
import { TrackScreen } from "../../../../analytics";
import LText from "../../../../components/LText";
import Button from "../../../../components/Button";
import RetryButton from "../../../../components/RetryButton";
import CancelButton from "../../../../components/CancelButton";
import GenericErrorBottomModal from "../../../../components/GenericErrorBottomModal";
import TooltipLabel from "../../../../components/TooltipLabel";
import CurrencyUnitValue from "../../../../components/CurrencyUnitValue";
import CounterValue from "../../../../components/CounterValue";
import TranslatedError from "../../../../components/TranslatedError";
import Switch from "../../../../components/Switch";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  currency: TokenCurrency,
};

export default function EnableAdvanced({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(
    account && account.type === "TokenAccount",
    "token account required",
  );
  const bridge = getAccountBridge(account, parentAccount);
  const {
    transaction,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction(() => ({
    transaction: route.params.transaction,
    account,
    parentAccount,
  }));

  invariant(transaction, "transaction required");

  const onContinue = useCallback(() => {
    navigation.replace(ScreenName.LendingEnableAmount, {
      ...route.params,
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
    });
  }, [navigation, route.params, account.id, parentAccount, transaction]);

  const onBridgeErrorCancel = useCallback(() => {
    const parent = navigation.dangerouslyGetParent();
    if (parent) parent.goBack();
  }, [navigation]);

  const onBridgeErrorRetry = useCallback(() => {
    if (!transaction) return;
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [bridge, setTransaction, transaction]);

  const updateLimitTransaction = useCallback(
    (useAllAmount: boolean) => {
      setTransaction(
        bridge.updateTransaction(transaction, {
          amount: !useAllAmount ? account.spendableBalance : BigNumber(0),
          useAllAmount,
        }),
      );
    },
    [setTransaction, bridge, transaction, account.spendableBalance],
  );

  const onEditAmount = useCallback(() => {
    navigation.navigate(ScreenName.LendingEnableAmountInput, {
      ...route.params,
      transaction,
    });
  }, [navigation, route.params, transaction]);

  const { useAllAmount, amount } = transaction;
  const unit = getAccountUnit(account);
  const { currency } = route.params;

  const error = status.errors.amount;
  const warning = status.warnings.amount;

  return (
    <>
      <TrackScreen
        category="Lend Approve"
        name="step 1 (Advanced)"
        eventProperties={{ currencyName: currency.name }}
      />
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
      >
        <View style={styles.container}>
          <View style={styles.row}>
            <TooltipLabel
              label={
                <Trans i18nKey="transfer.lending.enable.advanced.amountLabel" />
              }
              tooltip={
                <Trans i18nKey="transfer.lending.enable.advanced.amountLabelTooltip" />
              }
            />
            <View style={styles.limitRow}>
              {!useAllAmount && (
                <LText semiBold style={styles.limitLabel}>
                  <Trans i18nKey="transfer.lending.enable.advanced.limited" />
                </LText>
              )}
              <Switch
                style={styles.switch}
                onValueChange={updateLimitTransaction}
                value={useAllAmount}
              />
            </View>
          </View>
          <View style={styles.row}>
            <LText style={styles.label} color="grey">
              <Trans i18nKey="transfer.lending.enable.advanced.limit" />
            </LText>
            {useAllAmount ? (
              <LText semiBold style={styles.limitLabel}>
                <Trans i18nKey="transfer.lending.enable.advanced.noLimit" />
              </LText>
            ) : (
              <TouchableOpacity
                style={styles.editSection}
                onPress={onEditAmount}
              >
                <LText semiBold numberOfLines={1} style={styles.limitLabel}>
                  <CurrencyUnitValue showCode unit={unit} value={amount} />
                </LText>
                <LText
                  style={[
                    styles.link,
                    {
                      textDecorationColor: colors.live,
                    },
                  ]}
                  color="live"
                >
                  <Trans i18nKey="common.edit" />{" "}
                </LText>
                <LText style={styles.countervalue} color="grey">
                  <CounterValue
                    showCode
                    currency={currency}
                    value={amount}
                    withPlaceholder
                    before="≈ "
                  />
                </LText>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.row}>
            <LText
              style={[styles.error]}
              color={warning ? "orange" : "alert"}
              numberOfLines={2}
            >
              <TranslatedError error={error || warning} />
            </LText>
          </View>
        </View>
        <View style={styles.bottomWrapper}>
          <View style={styles.continueWrapper}>
            <Button
              event="FreezeAmountContinue"
              type="primary"
              title={<Trans i18nKey="common.continue" />}
              onPress={onContinue}
              disabled={!!status.errors.amount || bridgePending}
              pending={bridgePending}
            />
          </View>
        </View>
      </SafeAreaView>

      <GenericErrorBottomModal
        error={bridgeError}
        onClose={onBridgeErrorRetry}
        footerButtons={
          <>
            <CancelButton
              containerStyle={styles.button}
              onPress={onBridgeErrorCancel}
            />
            <RetryButton
              containerStyle={[styles.button, styles.buttonRight]}
              onPress={onBridgeErrorRetry}
            />
          </>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "stretch",
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  limitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bottomWrapper: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 16,
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
  switch: { marginLeft: 8 },
  limitLabel: { fontSize: 14 },
  label: { fontSize: 13 },
  editSection: {
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  link: {
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    marginLeft: 8,
  },
  countervalue: {
    fontSize: 12,
    position: "absolute",
    bottom: -20,
    right: 0,
  },
  error: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
  },
});
