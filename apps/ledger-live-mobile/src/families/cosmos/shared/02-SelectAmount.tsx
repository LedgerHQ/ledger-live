import invariant from "invariant";
import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import type {
  CosmosValidatorItem,
  Transaction,
} from "@ledgerhq/live-common/families/cosmos/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useTheme } from "styled-components/native";
import { accountScreenSelector } from "../../../reducers/accounts";
import { localeSelector } from "../../../reducers/settings";
import Button from "../../../components/Button";
import CurrencyInput from "../../../components/CurrencyInput";
import LText from "../../../components/LText";
import Warning from "../../../icons/Warning";
import Check from "../../../icons/Check";
import KeyboardView from "../../../components/KeyboardView";

type RouteParams = {
  accountId: string;
  transaction: Transaction;
  validator: CosmosValidatorItem;
  validatorSrc?: CosmosValidatorItem;
  min?: BigNumber;
  max?: BigNumber;
  value?: BigNumber;
  redelegatedBalance?: BigNumber;
  mode: string;
  nextScreen: string;
};
type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};

function DelegationAmount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const locale = useSelector(localeSelector);
  invariant(
    account && account.cosmosResources && route.params.transaction,
    "account and cosmos transaction required",
  );
  const bridge = getAccountBridge(account, undefined);
  const unit = getAccountUnit(account);
  const initialValue = useMemo(
    () => route?.params?.value ?? BigNumber(0),
    [route],
  );
  const redelegatedBalance = route?.params?.redelegatedBalance ?? BigNumber(0);
  const mode = route?.params?.mode ?? "delegation";
  const [value, setValue] = useState(() => initialValue);
  const initialMax = useMemo(() => route?.params?.max ?? BigNumber(0), [route]);
  const max = useMemo(
    () => initialMax.minus(value.minus(initialValue)),
    [initialValue, initialMax, value],
  );
  const min = useMemo(() => route?.params?.min ?? BigNumber(0), [route]);
  const onNext = useCallback(() => {
    const tx = route.params.transaction;
    const validators = tx.validators;
    const validatorAddress = route.params.validator.validatorAddress;
    const i = validators.findIndex(
      ({ address }) => address === validatorAddress,
    );

    if (i >= 0) {
      validators[i].amount = value;
    } else {
      validators.push({
        address: validatorAddress,
        amount: value,
      });
    }

    const filteredValidators =
      tx.mode === "delegate"
        ? validators.filter(v => !v.amount.eq(0))
        : validators;
    const transaction = bridge.updateTransaction(
      tx,
      tx.mode === "delegate"
        ? {
            amount: new BigNumber(value),
            validators: filteredValidators,
          }
        : {
            validators: filteredValidators,
          },
    );
    navigation.navigate(route.params.nextScreen, {
      ...route.params,
      transaction,
      fromSelectAmount: true,
    });
  }, [navigation, route.params, bridge, value]);
  const [ratioButtons] = useState(
    [0.25, 0.5, 0.75, 1].map(ratio => ({
      label: `${ratio * 100}%`,
      value: initialMax.plus(initialValue).multipliedBy(ratio).integerValue(),
    })),
  );
  const error = useMemo(
    () =>
      max.lt(0) ||
      value.lt(min) ||
      (route.params.transaction.mode === "redelegate" && value.eq(0)),
    [value, max, min, route.params.transaction],
  );
  let behaviorParam;

  if (Platform.OS === "ios") {
    behaviorParam = "padding";
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background.main,
        },
      ]}
    >
      <KeyboardView behavior={behaviorParam}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.main}>
              <CurrencyInput
                unit={unit}
                value={value}
                onChange={setValue}
                inputStyle={styles.inputStyle}
                hasError={error}
              />
              <View style={styles.ratioButtonContainer}>
                {ratioButtons.map(({ label, value: v }) => (
                  <TouchableOpacity
                    key={label}
                    style={[
                      styles.ratioButton,
                      value.eq(v)
                        ? {
                            backgroundColor: colors.primary.c80,
                          }
                        : {
                            borderColor: colors.neutral.c60,
                          },
                    ]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setValue(v);
                    }}
                  >
                    <LText
                      style={[styles.ratioLabel]}
                      color={
                        value.eq(v) ? colors.neutral.c100 : colors.neutral.c60
                      }
                    >
                      {label}
                    </LText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View
              style={[
                styles.footer,
                {
                  backgroundColor: colors.background.main,
                },
              ]}
            >
              {error && !value.eq(0) && (
                <View style={styles.labelContainer}>
                  <Warning size={16} color={colors.error.c100} />
                  <LText
                    style={[styles.assetsRemaining]}
                    color={colors.error.c100}
                  >
                    <Trans
                      i18nKey={
                        value.lt(min)
                          ? "cosmos.delegation.flow.steps.amount.minAmount"
                          : "cosmos.delegation.flow.steps.amount.incorrectAmount"
                      }
                      values={{
                        min: formatCurrencyUnit(unit, min, {
                          showCode: true,
                          showAllDigits: true,
                          locale,
                        }),
                        max: formatCurrencyUnit(unit, initialMax, {
                          showCode: true,
                          showAllDigits: true,
                          locale,
                        }),
                      }}
                    >
                      <LText semiBold>{""}</LText>
                    </Trans>
                  </LText>
                </View>
              )}
              {max.isZero() && (
                <View style={styles.labelContainer}>
                  <Check size={16} color={colors.success.c100} />
                  <LText
                    style={[styles.assetsRemaining]}
                    color={colors.success.c100}
                  >
                    <Trans
                      i18nKey={`cosmos.${mode}.flow.steps.amount.allAssetsUsed`}
                    />
                  </LText>
                </View>
              )}
              {max.gt(0) && !error && (
                <View style={styles.labelContainer}>
                  <LText style={styles.assetsRemaining}>
                    <Trans
                      i18nKey="cosmos.delegation.flow.steps.amount.assetsRemaining"
                      values={{
                        amount: formatCurrencyUnit(unit, max, {
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
              {!error && redelegatedBalance.gt(0) && (
                <View style={[styles.labelContainer, styles.labelSmall]}>
                  <LText style={[styles.assetsRemaining, styles.small]}>
                    <Trans
                      i18nKey="cosmos.redelegation.flow.steps.amount.newRedelegatedBalance"
                      values={{
                        amount: formatCurrencyUnit(
                          unit,
                          redelegatedBalance.plus(value),
                          {
                            showCode: true,
                            locale,
                          },
                        ),
                        name: route.params.validator?.name ?? "",
                      }}
                    >
                      <LText semiBold>{""}</LText>
                    </Trans>
                  </LText>
                </View>
              )}
              <Button
                disabled={error}
                event="Cosmos DelegationAmountContinueBtn"
                onPress={onNext}
                title={
                  <Trans i18nKey="cosmos.delegation.flow.steps.amount.cta" />
                }
                type="primary"
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "stretch",
  },
  inputStyle: {
    textAlign: "center",
    fontSize: 40,
    fontWeight: "600",
  },
  ratioButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
    height: 36,
    marginTop: 16,
  },
  ratioButton: {
    marginHorizontal: 5,
    width: 60,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0)",
    paddingVertical: 8,
  },
  ratioPrimaryButton: {},
  ratioLabel: {
    textAlign: "center",
  },
  footer: {
    alignSelf: "stretch",
    padding: 8,
  },
  labelContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 16,
  },
  labelSmall: {
    paddingBottom: 4,
  },
  assetsRemaining: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 32,
    paddingHorizontal: 10,
  },
  small: {
    fontSize: 11,
    lineHeight: 16,
  },
});
export default DelegationAmount;
