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

const PickAmount = (props: any) => {
  const { colors } = useTheme();
  const { navigation, route } = props;
  const { amount, account, validator, transaction } = route.params;

  const unit = getAccountUnit(account);
  const locale = useSelector(localeSelector);
  const bridge = useMemo(() => getAccountBridge(account), [account]);
  /*
   * Instantiate the transaction when opening the flow. Only gets runned once.
   */

  const [value, setValue] = useState(new BigNumber(amount));

  const ratios = useMemo(
    () =>
      [0.25, 0.5, 0.75, 1].map(ratio => ({
        label: `${ratio * 100}%`,
        value: amount.multipliedBy(ratio).integerValue(),
      })),
    [amount],
  );

  const minimumDelegationAmount = useMemo(
    () => new BigNumber(nominate("1")),
    [],
  );

  const allAssetsUndelegated = useMemo(
    () => amount.minus(value).isZero(),
    [amount, value],
  );

  const undelegationBelowMinimum = useMemo(
    () =>
      value.eq(amount)
        ? false
        : amount.minus(value).lt(minimumDelegationAmount),
    [amount, value],
  );

  const undelegationAboveMaximum = useMemo(
    () => value.gt(amount),
    [amount, value],
  );

  const showAssetsRemaining =
    amount.gt(value) && !undelegationBelowMinimum && !undelegationAboveMaximum;

  const [denominatedMinimum, denominatedMaximum] = [
    denominate({ input: String(minimumDelegationAmount), decimals: 4 }),
    denominate({ input: String(amount), decimals: 4 }),
  ];

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.ElrondUndelegationValidator, {
      account,
      amount: value,
      validator,
      transaction: bridge.updateTransaction(transaction, {
        amount: value,
      }),
    });
  }, [account, bridge, validator, navigation, value, transaction]);

  const updateValue = useCallback(
    (value: BigNumber) => {
      setValue(value);
      bridge.updateTransaction(transaction, { amount: value });
    },
    [bridge],
  );

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
                hasError={undelegationBelowMinimum || undelegationAboveMaximum}
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
              {(undelegationBelowMinimum || undelegationAboveMaximum) && (
                <View style={styles.labelContainer}>
                  <Warning size={16} color={colors.error.c100} />

                  <LText
                    style={styles.assetsRemaining}
                    color={colors.error.c100}
                  >
                    <Trans
                      i18nKey={
                        undelegationAboveMaximum
                          ? "elrond.undelegation.flow.steps.amount.incorrectAmount"
                          : "elrond.undelegation.flow.steps.amount.minAmount"
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

              {showAssetsRemaining && (
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
                disabled={undelegationBelowMinimum || undelegationAboveMaximum}
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
