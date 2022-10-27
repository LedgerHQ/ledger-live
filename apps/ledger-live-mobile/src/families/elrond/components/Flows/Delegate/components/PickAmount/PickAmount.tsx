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
import estimateMaxSpendable from "@ledgerhq/live-common/families/elrond/js-estimateMaxSpendable";

import type { Transaction } from "@ledgerhq/live-common/families/elrond/types";
import type { PickAmountPropsType } from "./types";

import { localeSelector } from "../../../../../../../reducers/settings";
import { ScreenName } from "../../../../../../../const";
import Button from "../../../../../../../components/Button";
import CurrencyInput from "../../../../../../../components/CurrencyInput";
import LText from "../../../../../../../components/LText";
import Warning from "../../../../../../../icons/Warning";
import Check from "../../../../../../../icons/Check";
import KeyboardView from "../../../../../../../components/KeyboardView";

import { denominate } from "../../../../../helpers/denominate";
import { MIN_DELEGATION_AMOUNT } from "../../../../../constants";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const PickAmount = (props: PickAmountPropsType) => {
  const { colors } = useTheme();
  const { navigation, route } = props;
  const { account, validators } = route.params;

  const unit = getAccountUnit(account);
  const locale = useSelector(localeSelector);
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
   * Created a memoized list of all the ratios and expose the calculated value based on each percentage.
   */

  const ratios = useMemo(
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

  const allAssetsUsed = useMemo(
    () => maxSpendable.minus(amount).isZero(),
    [amount, maxSpendable],
  );

  /*
   * Check if the assets chosen for delegation are below the minimum required.
   */

  const delegationBelowMinimum = useMemo(() => {
    const amountBelowMinimum = amount.lt(MIN_DELEGATION_AMOUNT);
    const balanceBelowMinimum = maxSpendable.lt(MIN_DELEGATION_AMOUNT);

    if (amount.eq(0)) {
      return false;
    }

    return amountBelowMinimum || balanceBelowMinimum;
  }, [amount, maxSpendable]);

  /*
   * Check if the currently selected amount exceeds the maximum amount of assets available.
   */

  const delegationAboveMaximum = useMemo(
    () => amount.gt(maxSpendable),
    [amount, maxSpendable],
  );

  const showAssetsRemaining =
    maxSpendable.gt(amount) &&
    !delegationAboveMaximum &&
    !delegationBelowMinimum;

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
                hasError={delegationBelowMinimum || delegationAboveMaximum}
              />

              <View style={styles.ratioButtonContainer}>
                {ratios.map(ratio => (
                  <TouchableOpacity
                    key={ratio.label}
                    style={[
                      styles.ratioButton,
                      {
                        backgroundColor: ratio.value.eq(amount)
                          ? colors.primary.c80
                          : undefined,
                        borderColor: ratio.value.eq(amount)
                          ? undefined
                          : colors.neutral.c60,
                      },
                    ]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setAmount(ratio.value);
                    }}
                  >
                    <LText
                      style={styles.ratioLabel}
                      color={
                        ratio.value.eq(amount)
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
              {(delegationBelowMinimum || delegationAboveMaximum) && (
                <View style={styles.labelContainer}>
                  <Warning size={16} color={colors.error.c100} />

                  <LText
                    style={styles.assetsRemaining}
                    color={colors.error.c100}
                  >
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
                  <Check size={16} color={colors.success.c100} />
                  <LText
                    style={styles.assetsRemaining}
                    color={colors.success.c100}
                  >
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
                        amount: formatCurrencyUnit(
                          unit,
                          maxSpendable.minus(amount),
                          { showCode: true, locale },
                        ),
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
