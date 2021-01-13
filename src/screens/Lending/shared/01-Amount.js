/* @flow */
import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import invariant from "invariant";
import type {
  Transaction,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { useSupplyMaxChoiceButtons } from "@ledgerhq/live-common/lib/compound/react";
import { useTheme } from "@react-navigation/native";
import { accountScreenSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
import LText from "../../../components/LText";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import Button from "../../../components/Button";
import KeyboardView from "../../../components/KeyboardView";
import RetryButton from "../../../components/RetryButton";
import CancelButton from "../../../components/CancelButton";
import GenericErrorBottomModal from "../../../components/GenericErrorBottomModal";
import CurrencyInput from "../../../components/CurrencyInput";
import TranslatedError from "../../../components/TranslatedError";
import Switch from "../../../components/Switch";

type Props = {
  navigation: any,
  route: { params: RouteParams },
  transaction: Transaction,
  setTransaction: (tx: any) => void,
  status: *,
  bridgePending: boolean,
  bridgeError: *,
  max: BigNumber,
  onContinue: () => void,
  onChangeSendMax?: (value: boolean) => void,
  category: string,
};

type RouteParams = {
  accountId: string,
  parentId: string,
  currency: TokenCurrency,
};

export default function AmountScreen({
  navigation,
  route,
  transaction,
  setTransaction,
  status,
  bridgePending,
  bridgeError,
  max,
  onContinue,
  onChangeSendMax,
  category,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { currency } = route.params;
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account is required");

  const bridge = getAccountBridge(account, parentAccount);
  const [selectedRatio, selectRatio] = useState();

  const onChange = useCallback(
    (amount, keepRatio) => {
      if (!keepRatio) selectRatio();
      setTransaction(
        bridge.updateTransaction(transaction, {
          amount,
          useAllAmount: false,
        }),
      );
    },
    [setTransaction, transaction, bridge],
  );

  const [bridgeErr, setBridgeErr] = useState(bridgeError);

  useEffect(() => setBridgeErr(bridgeError), [bridgeError]);

  const onBridgeErrorCancel = useCallback(() => {
    setBridgeErr(null);
    const parent = navigation.dangerouslyGetParent();
    if (parent) parent.goBack();
  }, [navigation]);

  const onBridgeErrorRetry = useCallback(() => {
    setBridgeErr(null);
    if (!transaction) return;
    setTransaction(bridge.updateTransaction(transaction, {}));
  }, [setTransaction, transaction, bridge]);

  const blur = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const onRatioPress = useCallback(
    value => {
      blur();
      selectRatio(value);
      onChange(value, true);
    },
    [blur, onChange],
  );

  const maxChoiceButtons = useSupplyMaxChoiceButtons(max);

  const amountButtons = useMemo(() => !onChangeSendMax && maxChoiceButtons, [
    maxChoiceButtons,
    onChangeSendMax,
  ]);

  const { amount, useAllAmount } = transaction;
  const unit = getAccountUnit(account);

  const error = amount.eq(0) || bridgePending ? null : status.errors.amount;
  const warning = status.warnings.amount;

  return (
    <>
      <TrackScreen
        category={category}
        name="step 1 (Amount)"
        eventProperties={{ currencyName: currency.name }}
      />
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
      >
        <KeyboardView style={styles.container}>
          <TouchableWithoutFeedback onPress={blur}>
            <View style={styles.root}>
              <View style={styles.wrapper}>
                <CurrencyInput
                  editable
                  isActive
                  onChange={onChange}
                  unit={unit}
                  value={useAllAmount ? undefined : amount}
                  autoFocus
                  style={styles.inputContainer}
                  inputStyle={styles.inputStyle}
                  hasError={!!error}
                  hasWarning={!!warning}
                  placeholder={
                    useAllAmount
                      ? t("transfer.lending.supply.amount.placeholderMax")
                      : undefined
                  }
                />
                <LText
                  style={[styles.error]}
                  color={error ? "alert" : "orange"}
                  numberOfLines={2}
                >
                  <TranslatedError error={error || warning} />
                </LText>
              </View>
              {amountButtons && amountButtons.length > 0 && (
                <View style={styles.amountRatioContainer}>
                  {amountButtons.map(({ value, label }, key) => (
                    <TouchableOpacity
                      style={[
                        styles.amountRatioButton,
                        selectedRatio === value
                          ? {
                              backgroundColor: colors.live,
                              borderColor: colors.live,
                            }
                          : { borderColor: colors.grey },
                      ]}
                      key={key}
                      onPress={() => onRatioPress(value)}
                    >
                      <LText
                        style={[styles.amountRatioLabel]}
                        color={selectedRatio === value ? "white" : "grey"}
                      >
                        {label}
                      </LText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.bottomWrapper}>
                <View style={[styles.available]}>
                  {onChangeSendMax ? (
                    <>
                      <View style={styles.availableLeft}>
                        <LText
                          semiBold
                          style={styles.availableAmount}
                          color="grey"
                        >
                          <Trans i18nKey="transfer.lending.supply.amount.totalAvailable" />
                        </LText>
                        <LText semiBold color="grey">
                          <CurrencyUnitValue showCode unit={unit} value={max} />
                        </LText>
                      </View>
                      <View style={styles.availableRight}>
                        <LText style={styles.maxLabel}>
                          <Trans i18nKey="send.amount.useMax" />
                        </LText>
                        <Switch
                          style={styles.switch}
                          value={useAllAmount}
                          onValueChange={onChangeSendMax}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <LText
                        semiBold
                        style={styles.availableAmount}
                        color="grey"
                      >
                        <Trans i18nKey="transfer.lending.supply.amount.totalAvailable" />
                      </LText>
                      <LText semiBold color="grey">
                        <CurrencyUnitValue showCode unit={unit} value={max} />
                      </LText>
                    </>
                  )}
                </View>
                <View style={styles.continueWrapper}>
                  <Button
                    event={`${category}AmountContinue`}
                    type="primary"
                    title={<Trans i18nKey="common.continue" />}
                    onPress={onContinue}
                    disabled={!!status.errors.amount || bridgePending}
                    pending={bridgePending}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardView>
      </SafeAreaView>
      <GenericErrorBottomModal
        error={bridgeErr}
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
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  available: {
    flexDirection: "row",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  availableRight: {
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  availableLeft: {
    justifyContent: "center",
    flexGrow: 1,
  },
  availableAmount: {
    marginRight: 6,
  },
  bottomWrapper: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 1,
  },
  continueWrapper: {
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
  },
  amountRatioContainer: {
    flexGrow: 1,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  amountRatioButton: {
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginHorizontal: 5,
  },
  amountRatioLabel: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },
  wrapper: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "column",
    alignContent: "center",
    justifyContent: "center",
  },
  inputContainer: { flexBasis: 75 },
  inputStyle: { flex: 1, flexShrink: 1, textAlign: "center" },
  error: {
    fontSize: 14,
    textAlign: "center",
  },
  maxLabel: {
    marginRight: 4,
  },
  switch: {
    opacity: 0.99,
  },
});
