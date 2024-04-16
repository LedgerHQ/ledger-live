import React, { useCallback, useMemo, useState } from "react";
import { View, Keyboard, TouchableOpacity, TouchableWithoutFeedback, Platform } from "react-native";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useTheme } from "styled-components/native";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { MIN_DELEGATION_AMOUNT } from "@ledgerhq/live-common/families/elrond/constants";

import type { PickAmountPropsType, RatioType } from "./types";

import { ScreenName } from "~/const";
import Button from "~/components/Button";
import CurrencyInput from "~/components/CurrencyInput";
import LText from "~/components/LText";
import Warning from "~/icons/Warning";
import Check from "~/icons/Check";
import KeyboardView from "~/components/KeyboardView";

import styles from "./styles";
import { useSettings } from "~/hooks";

/*
 * Handle the component declaration.
 */

const PickAmount = (props: PickAmountPropsType) => {
  const { colors } = useTheme();
  const { navigation, route } = props;
  const { amount, account, validator } = route.params;

  const unit = getAccountUnit(account);
  const bridge = getAccountBridge(account, undefined);
  const { locale } = useSettings();

  const [value, setValue] = useState(new BigNumber(amount));

  /*
   * Instantiate the transaction when opening the flow. Only gets runned once.
   */

  const { transaction, updateTransaction } = useBridgeTransaction(() => ({
    account,
    transaction: bridge.updateTransaction(bridge.createTransaction(account), {
      recipient: validator.contract,
      mode: "unDelegate",
      amount,
    }),
  }));

  /*
   * Created a memoized list of all the ratios and expose the calculated value based on each percentage.
   */

  const ratios = useMemo<RatioType[]>(
    () =>
      [0.25, 0.5, 0.75, 1].map(ratio => ({
        label: `${ratio * 100}%`,
        value: amount.multipliedBy(ratio).integerValue(),
      })),
    [amount],
  );

  /*
   * Check if the currently selected amount exceeds the maximum amount of assets available.
   */

  const amountAboveMaximum = useMemo(() => value.isGreaterThan(amount), [amount, value]);

  /*
   * Check if all the assets have been chosen for undelegation.
   */

  const allAssetsUndelegated = useMemo(() => amount.minus(value).isZero(), [amount, value]);

  /*
   * Check if the assets chosen for undelegation are below the minimum required.
   */

  const amountBelowMinimum = useMemo(
    () => (value.isEqualTo(amount) ? false : value.isLessThan(MIN_DELEGATION_AMOUNT)),
    [amount, value],
  );

  /*
   * Check if the assets remaining after undelegation are below the minimum required.
   */

  const amountRemainingInvalid = useMemo(
    () => amount.minus(value).isLessThan(MIN_DELEGATION_AMOUNT) && !amount.minus(value).isZero(),
    [amount, value],
  );

  /*
   * Return two booleans, one showing if there are any errors, and the second if there aren't.
   */

  const [hasErrors, noErrors] = useMemo(
    () => [
      amountBelowMinimum || amountAboveMaximum || amountRemainingInvalid,
      !amountBelowMinimum && !amountAboveMaximum && !amountRemainingInvalid,
    ],
    [amountBelowMinimum, amountAboveMaximum, amountRemainingInvalid],
  );

  const [denominatedMinimum, denominatedMaximum] = [
    denominate({ input: String(MIN_DELEGATION_AMOUNT), decimals: 4 }),
    denominate({ input: String(amount), decimals: 4 }),
  ];

  /*
   * Callback running when changing the screen to select the device, passing along the needed data.
   */

  const onContinue = useCallback(() => {
    if (transaction) {
      navigation.navigate(ScreenName.ElrondUndelegationSelectDevice, {
        accountId: account.id,
        transaction,
      });
    }
  }, [account, transaction, navigation]);

  /*
   * When updating the value through input or percentages, update the state and the bridge transaction.
   */

  const updateValue = useCallback(
    (value: BigNumber) => {
      setValue(value);
      updateTransaction(transaction =>
        bridge.updateTransaction(transaction, {
          amount: value,
        }),
      );
    },
    [bridge, updateTransaction],
  );

  /*
   * Handle the ration selection callback.
   */

  const onRatioPress = useCallback(
    (ratio: RatioType) => {
      Keyboard.dismiss();
      updateValue(ratio.value);
    },
    [updateValue],
  );

  /*
   * Return the rendered component.
   */

  return (
    <View style={[styles.root, { backgroundColor: colors.background.main }]}>
      <KeyboardView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.main}>
              <CurrencyInput
                unit={unit}
                value={value}
                onChange={setValue}
                inputStyle={styles.inputStyle}
                hasError={hasErrors}
                isActive={true}
              />

              <View style={styles.ratioButtonContainer}>
                {ratios.map(ratio => (
                  <TouchableOpacity
                    key={ratio.label}
                    style={[
                      styles.ratioButton,
                      {
                        backgroundColor: ratio.value.isEqualTo(value)
                          ? colors.primary.c80
                          : undefined,
                        borderColor: ratio.value.isEqualTo(value) ? undefined : colors.neutral.c60,
                      },
                    ]}
                    onPress={() => onRatioPress(ratio)}
                  >
                    <LText
                      style={styles.ratioLabel}
                      color={
                        ratio.value.isEqualTo(value) ? colors.neutral.c100 : colors.neutral.c60
                      }
                    >
                      {ratio.label}
                    </LText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.footer, { backgroundColor: colors.background.main }]}>
              {hasErrors && (
                <View style={styles.labelContainer}>
                  <Warning size={16} color={colors.error.c50} />

                  <LText style={styles.assetsRemaining} color={colors.error.c50}>
                    <Trans
                      i18nKey={
                        amountAboveMaximum
                          ? "elrond.undelegation.flow.steps.amount.incorrectAmount"
                          : amountBelowMinimum
                          ? "elrond.undelegation.flow.steps.amount.minAmount"
                          : "elrond.undelegation.flow.steps.amount.minRemaining"
                      }
                      values={{
                        min: `${denominatedMinimum} ${unit.code}`,
                        max: `${denominatedMaximum} ${unit.code}`,
                      }}
                    />
                  </LText>
                </View>
              )}

              {allAssetsUndelegated && (
                <View style={styles.labelContainer}>
                  <Check size={16} color={colors.success.c50} />
                  <LText style={styles.assetsRemaining} color={colors.success.c50}>
                    <Trans i18nKey="elrond.undelegation.flow.steps.amount.allAssetsUsed" />
                  </LText>
                </View>
              )}

              {!allAssetsUndelegated && noErrors && (
                <View style={styles.labelContainer}>
                  <LText style={styles.assetsRemaining}>
                    <Trans
                      i18nKey="elrond.undelegation.flow.steps.amount.assetsRemaining"
                      values={{
                        amount: formatCurrencyUnit(unit, amount.minus(value), {
                          showCode: true,
                          locale: locale,
                        }),
                      }}
                    >
                      <LText semiBold>{""}</LText>
                    </Trans>
                  </LText>
                </View>
              )}

              <Button
                disabled={hasErrors}
                event="Elrond UndelegationAmountContinueBtn"
                onPress={onContinue}
                type="primary"
                title={<Trans i18nKey="elrond.delegation.flow.steps.amount.cta" />}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardView>
    </View>
  );
};

export default PickAmount;
