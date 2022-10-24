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

const PickAmount = (props: PickAmountPropsType) => {
  const { colors } = useTheme();
  const { navigation, route } = props;
  const { transaction, account, validators } = route.params;

  const [maxSpendable, setMaxSpendable] = useState(new BigNumber(0));
  const [amount, setAmount] = useState(new BigNumber(transaction.amount || 0));

  const unit = getAccountUnit(account);
  const locale = useSelector(localeSelector);
  const bridge = getAccountBridge(account);

  const getMaxSpendable = useCallback(() => {
    const fetchMaxSpendable = async () => {
      const amount = await estimateMaxSpendable({
        account,
        transaction,
        parentAccount: undefined,
      });

      setMaxSpendable(amount);
    };

    fetchMaxSpendable();
  }, [transaction, account]);

  const ratios = useMemo(
    () =>
      [0.25, 0.5, 0.75, 1].map(ratio => ({
        label: `${ratio * 100}%`,
        value: maxSpendable.multipliedBy(ratio).integerValue(),
      })),
    [maxSpendable],
  );

  const minimumDelegationAmount = useMemo(
    () => new BigNumber(nominate("1")),
    [],
  );

  const allAssetsUsed = useMemo(
    () => maxSpendable.minus(amount).isZero(),
    [amount, maxSpendable],
  );

  const delegationBelowMinimum = useMemo(() => {
    const amountBelowMinimum = amount.lt(minimumDelegationAmount);
    const balanceBelowMinimum = maxSpendable.lt(minimumDelegationAmount);

    if (amount.eq(0)) {
      return false;
    }

    return amountBelowMinimum || balanceBelowMinimum;
  }, [amount, maxSpendable, minimumDelegationAmount]);

  const delegationAboveMaximum = useMemo(
    () => amount.gt(maxSpendable),
    [amount, maxSpendable],
  );

  const showAssetsRemaining =
    maxSpendable.gt(amount) &&
    !delegationAboveMaximum &&
    !delegationBelowMinimum;

  const [denominatedMinimum, denominatedMaximum] = [
    denominate({ input: String(minimumDelegationAmount), decimals: 4 }),
    denominate({ input: String(maxSpendable), decimals: 4 }),
  ];

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.ElrondDelegationValidator, {
      account,
      validators,
      transaction: bridge.updateTransaction(transaction, { amount }),
    });
  }, [account, validators, bridge, amount, navigation, transaction]);

  useEffect(getMaxSpendable, [getMaxSpendable]);

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
                        min: `${denominatedMinimum} ${constants.egldLabel}`,
                        max: `${denominatedMaximum} ${constants.egldLabel}`,
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
