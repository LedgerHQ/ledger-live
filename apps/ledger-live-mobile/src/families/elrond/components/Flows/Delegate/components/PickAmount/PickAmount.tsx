import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Keyboard, TouchableOpacity, TouchableWithoutFeedback, Platform } from "react-native";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useTheme } from "styled-components/native";
import { MIN_DELEGATION_AMOUNT } from "@ledgerhq/live-common/families/elrond/constants";
import estimateMaxSpendable from "@ledgerhq/live-common/families/elrond/js-estimateMaxSpendable";

import type { Transaction } from "@ledgerhq/live-common/families/elrond/types";
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
  const { account, validators } = route.params;

  const unit = getAccountUnit(account);
  const { locale } = useSettings();
  const bridge = getAccountBridge(account);
  const transaction = route.params.transaction as Transaction;

  const [maxSpendable, setMaxSpendable] = useState(new BigNumber(0));
  const [amount, setAmount] = useState(new BigNumber(transaction.amount || 0));

  /*
   * Fetch the maximum assets' spendable amount estimation, and assign it to it's state.
   */

  const getMaxSpendable = useCallback(() => {
    const fetchMaxSpendable = async () => {
      const amount = await estimateMaxSpendable({
        account,
        transaction,
        parentAccount: undefined,
      });

      if (transaction) {
        setMaxSpendable(amount);
      }
    };

    fetchMaxSpendable();
  }, [transaction, account]);

  /*
   * Handle the ration selection callback.
   */

  const onRatioPress = useCallback((ratio: RatioType) => {
    Keyboard.dismiss();
    setAmount(ratio.value);
  }, []);

  /*
   * Created a memoized list of all the ratios and expose the calculated value based on each percentage.
   */

  const ratios = useMemo<RatioType[]>(
    () =>
      [0.25, 0.5, 0.75, 1].map(ratio => ({
        label: `${ratio * 100}%`,
        value: maxSpendable.multipliedBy(ratio).integerValue(),
      })),
    [maxSpendable],
  );

  /*
   * Check maximum spendable amount of assets has been selected for delegation.
   */

  const allAssetsUsed = useMemo(() => maxSpendable.minus(amount).isZero(), [amount, maxSpendable]);

  /*
   * Check if the assets chosen for delegation are below the minimum required. If zero, return false, since no amount was selected.
   */

  const delegationBelowMinimum = useMemo(() => {
    const amountBelowMinimum = amount.isLessThan(MIN_DELEGATION_AMOUNT);
    const balanceBelowMinimum = maxSpendable.isLessThan(MIN_DELEGATION_AMOUNT);

    if (amount.isEqualTo(0)) {
      return false;
    }

    return amountBelowMinimum || balanceBelowMinimum;
  }, [amount, maxSpendable]);

  /*
   * Check if the currently selected amount exceeds the maximum amount of assets available.
   */

  const delegationAboveMaximum = useMemo(
    () => amount.isGreaterThan(maxSpendable),
    [amount, maxSpendable],
  );

  const showAssetsRemaining =
    maxSpendable.isGreaterThan(amount) && !delegationAboveMaximum && !delegationBelowMinimum;

  const [denominatedMinimum, denominatedMaximum] = [
    denominate({ input: String(MIN_DELEGATION_AMOUNT), decimals: 4 }),
    denominate({ input: String(maxSpendable), decimals: 4 }),
  ];

  /*
   * Callback running when changing the screen to select the device, passing along the needed data.
   */

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.ElrondDelegationValidator, {
      account,
      validators,
      transaction: bridge.updateTransaction(transaction, { amount }),
    });
  }, [account, validators, bridge, amount, navigation, transaction]);

  /*
   * Track all callback reference updates and run the effect conditionally.
   */

  useEffect(getMaxSpendable, [getMaxSpendable]);

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
                value={amount}
                onChange={setAmount}
                inputStyle={styles.inputStyle}
                isActive={true}
                hasError={delegationBelowMinimum || delegationAboveMaximum}
              />

              <View style={styles.ratioButtonContainer}>
                {ratios.map(ratio => (
                  <TouchableOpacity
                    key={ratio.label}
                    onPress={() => onRatioPress(ratio)}
                    style={[
                      styles.ratioButton,
                      {
                        backgroundColor: ratio.value.isEqualTo(amount)
                          ? colors.primary.c80
                          : undefined,
                        borderColor: ratio.value.isEqualTo(amount) ? undefined : colors.neutral.c60,
                      },
                    ]}
                  >
                    <LText
                      style={styles.ratioLabel}
                      color={
                        ratio.value.isEqualTo(amount) ? colors.neutral.c100 : colors.neutral.c60
                      }
                    >
                      {ratio.label}
                    </LText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.footer, { backgroundColor: colors.background.main }]}>
              {(delegationBelowMinimum || delegationAboveMaximum) && (
                <View style={styles.labelContainer}>
                  <Warning size={16} color={colors.error.c50} />

                  <LText style={styles.assetsRemaining} color={colors.error.c50}>
                    <Trans
                      i18nKey={
                        delegationBelowMinimum
                          ? "elrond.delegation.flow.steps.amount.minAmount"
                          : "elrond.delegation.flow.steps.amount.incorrectAmount"
                      }
                      values={{
                        min: `${denominatedMinimum} ${unit.code}`,
                        max: `${denominatedMaximum} ${unit.code}`,
                      }}
                    >
                      <LText semiBold={true}>{""}</LText>
                    </Trans>
                  </LText>
                </View>
              )}

              {allAssetsUsed && (
                <View style={styles.labelContainer}>
                  <Check size={16} color={colors.success.c50} />
                  <LText style={styles.assetsRemaining} color={colors.success.c50}>
                    <Trans i18nKey="elrond.delegation.flow.steps.amount.allAssetsUsed" />
                  </LText>
                </View>
              )}

              {showAssetsRemaining && (
                <View style={styles.labelContainer}>
                  <LText style={styles.assetsRemaining}>
                    <Trans
                      i18nKey="elrond.delegation.flow.steps.amount.assetsRemaining"
                      values={{
                        amount: formatCurrencyUnit(unit, maxSpendable.minus(amount), {
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
                disabled={delegationAboveMaximum || delegationBelowMinimum}
                event="Elrond DelegationAmountContinueBtn"
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
