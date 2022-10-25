import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  View,
  Keyboard,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useTheme } from "styled-components/native";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";

import { localeSelector } from "../../../../../../../reducers/settings";
import { ScreenName } from "../../../../../../../const";
import Button from "../../../../../../../components/Button";
import CurrencyInput from "../../../../../../../components/CurrencyInput";
import LText from "../../../../../../../components/LText";
import Warning from "../../../../../../../icons/Warning";
import Check from "../../../../../../../icons/Check";
import KeyboardView from "../../../../../../../components/KeyboardView";

import { denominate, nominate } from "../../../../../helpers";
import { constants } from "../../../../../constants";

import type { PickAmountPropsType } from "./types";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const PickAmount = (props: PickAmountPropsType) => {
  const { colors } = useTheme();
  const { navigation, route } = props;
  const { amount, account, validator } = route.params;

  const unit = getAccountUnit(account);
  const bridge = getAccountBridge(account, undefined);
  const locale = useSelector(localeSelector);

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

  const ratios = useMemo(
    () =>
      [0.25, 0.5, 0.75, 1].map(ratio => ({
        label: `${ratio * 100}%`,
        value: amount.multipliedBy(ratio).integerValue(),
      })),
    [amount],
  );

  /*
   * Create a minimum delegation amount condition.
   */

  const minimumDelegationAmount = useMemo(
    () => new BigNumber(nominate("1")),
    [],
  );

  /*
   * Check if the currently selected amount exceeds the maximum amount of assets available.
   */

  const amountAboveMaximum = useMemo(() => value.gt(amount), [amount, value]);

  /*
   * Check if all the assets have been chosen for undelegation.
   */

  const allAssetsUndelegated = useMemo(
    () => amount.minus(value).isZero(),
    [amount, value],
  );

  /*
   * Check if the assets chosen for undelegation are below the minimum required.
   */

  const amountBelowMinimum = useMemo(
    () => (value.eq(amount) ? false : value.lt(minimumDelegationAmount)),
    [amount, minimumDelegationAmount, value],
  );

  /*
   * Check if the assets remaining after undelegation are below the minimum required.
   */

  const amountRemainingInvalid = useMemo(
    () =>
      amount.minus(value).lt(minimumDelegationAmount) &&
      !amount.minus(value).isZero(),
    [amount, minimumDelegationAmount, value],
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
    denominate({ input: String(minimumDelegationAmount), decimals: 4 }),
    denominate({ input: String(amount), decimals: 4 }),
  ];

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.ElrondUndelegationSelectDevice, {
      account,
      transaction,
    });
  }, [account, transaction, value, navigation]);

  const updateValue = useCallback(
    (value: BigNumber) => {
      setValue(value);
      updateTransaction(transaction =>
        bridge.updateTransaction(transaction, {
          amount: value,
        }),
      );
    },
    [bridge],
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
              />

              <View style={styles.ratioButtonContainer}>
                {ratios.map(ratio => (
                  <TouchableOpacity
                    key={ratio.label}
                    style={[
                      styles.ratioButton,
                      {
                        backgroundColor: ratio.value.eq(value)
                          ? colors.primary.c80
                          : undefined,
                        borderColor: ratio.value.eq(value)
                          ? undefined
                          : colors.neutral.c60,
                      },
                    ]}
                    onPress={() => {
                      Keyboard.dismiss();
                      updateValue(ratio.value);
                    }}
                  >
                    <LText
                      style={styles.ratioLabel}
                      color={
                        ratio.value.eq(value)
                          ? colors.neutral.c100
                          : colors.neutral.c60
                      }
                    >
                      {ratio.label}
                    </LText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View
              style={[
                styles.footer,
                { backgroundColor: colors.background.main },
              ]}
            >
              {hasErrors && (
                <View style={styles.labelContainer}>
                  <Warning size={16} color={colors.error.c100} />

                  <LText
                    style={styles.assetsRemaining}
                    color={colors.error.c100}
                  >
                    <Trans
                      i18nKey={
                        amountAboveMaximum
                          ? "elrond.undelegation.flow.steps.amount.incorrectAmount"
                          : amountAboveMaximum
                          ? "elrond.undelegation.flow.steps.amount.minAmount"
                          : "elrond.undelegation.flow.steps.amount.minRemaining"
                      }
                      values={{
                        min: `${denominatedMinimum} ${constants.egldLabel}`,
                        max: `${denominatedMaximum} ${constants.egldLabel}`,
                      }}
                    >
                      <LText semiBold={true}>{""}</LText>
                    </Trans>
                  </LText>
                </View>
              )}

              {allAssetsUndelegated && (
                <View style={styles.labelContainer}>
                  <Check size={16} color={colors.success.c100} />
                  <LText
                    style={styles.assetsRemaining}
                    color={colors.success.c100}
                  >
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
                          locale,
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
                title={
                  <Trans i18nKey="elrond.delegation.flow.steps.amount.cta" />
                }
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardView>
    </View>
  );
};

export default PickAmount;
