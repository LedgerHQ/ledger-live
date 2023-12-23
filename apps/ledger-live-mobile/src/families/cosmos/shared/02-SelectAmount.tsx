import invariant from "invariant";
import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingViewProps,
} from "react-native";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import type { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { getMaxEstimatedBalance } from "@ledgerhq/live-common/families/cosmos/logic";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useTheme } from "styled-components/native";
import { accountScreenSelector } from "~/reducers/accounts";
import Button from "~/components/Button";
import CurrencyInput from "~/components/CurrencyInput";
import LText from "~/components/LText";
import Warning from "~/icons/Warning";
import Check from "~/icons/Check";
import KeyboardView from "~/components/KeyboardView";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { CosmosDelegationFlowParamList } from "../DelegationFlow/types";
import type { CosmosRedelegationFlowParamList } from "../RedelegationFlow/types";
import { CosmosUndelegationFlowParamList } from "../UndelegationFlow/types";
import { useSettings } from "~/hooks";

type Props =
  | StackNavigatorProps<CosmosDelegationFlowParamList, ScreenName.CosmosDelegationAmount>
  | StackNavigatorProps<
      CosmosRedelegationFlowParamList,
      ScreenName.CosmosDefaultRedelegationAmount | ScreenName.CosmosRedelegationAmount
    >
  | StackNavigatorProps<CosmosUndelegationFlowParamList, ScreenName.CosmosUndelegationAmount>;

function DelegationAmount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const { locale } = useSettings();
  invariant(
    account && (account as CosmosAccount).cosmosResources && route.params.transaction,
    "account and cosmos transaction required",
  );
  const tx = route.params.transaction;
  invariant(
    ["delegate", "redelegate", "undelegate"].includes(tx.mode),
    "unsupported cosmos transaction mode",
  );

  const bridge = getAccountBridge(account, undefined);
  const unit = getAccountUnit(account);
  const initialValue = useMemo(() => route?.params?.value ?? BigNumber(0), [route]);
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
    const validators = tx.validators;
    const validatorAddress = route.params.validator.validatorAddress;
    const i = validators.findIndex(({ address }) => address === validatorAddress);

    if (i >= 0) {
      validators[i].amount = value;
    } else {
      validators.push({
        address: validatorAddress,
        amount: value,
      });
    }

    const filteredValidators =
      tx.mode === "delegate" ? validators.filter(v => !v.amount.eq(0)) : validators;
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
    // @ts-expect-error navigate cannot infer the correct navigator + route
    navigation.navigate(route.params.nextScreen, {
      ...route.params,
      validatorName: route.params.validator.name,
      transaction,
      fromSelectAmount: true,
    });
  }, [navigation, route.params, bridge, tx, value]);
  const [ratioButtons] = useState(
    [0.25, 0.5, 0.75, 1].map(ratio => ({
      label: `${ratio * 100}%`,
      value: initialMax.plus(initialValue).multipliedBy(ratio).integerValue(),
    })),
  );
  // not enough available balance to pay fees for the delegate/undelegate/redelegate transaction
  const isNotEnoughBalance: boolean = useMemo(
    () => getMaxEstimatedBalance(account as CosmosAccount, tx.fees || new BigNumber(0)).isZero(),
    [account, tx.fees],
  );
  const isAmountOutOfRange: boolean = useMemo(
    () =>
      max.lt(0) ||
      value.lt(min) ||
      value.eq(0) ||
      (route.params.transaction.mode === "redelegate" && value.eq(0)),
    [value, max, min, route.params.transaction],
  );
  let behaviorParam: KeyboardAvoidingViewProps["behavior"] | undefined;

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
                hasError={isAmountOutOfRange || isNotEnoughBalance}
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
                      color={value.eq(v) ? colors.neutral.c100 : colors.neutral.c60}
                      testID={"delegate-ratio-" + label}
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
              {(isNotEnoughBalance || (isAmountOutOfRange && !value.eq(0))) && (
                <View style={styles.labelContainer}>
                  <Warning size={16} color={colors.error.c50} />
                  <LText style={[styles.assetsRemaining]} color={colors.error.c50}>
                    <Trans
                      i18nKey={
                        isNotEnoughBalance
                          ? "errors.NotEnoughBalance.title"
                          : value.gte(min)
                          ? "cosmos.delegation.flow.steps.amount.minAmount"
                          : "cosmos.delegation.flow.steps.amount.incorrectAmount"
                      }
                      values={{
                        min: formatCurrencyUnit(unit, min, {
                          showCode: true,
                          showAllDigits: true,
                          locale: locale,
                        }),
                        max: formatCurrencyUnit(unit, initialMax, {
                          showCode: true,
                          showAllDigits: true,
                          locale: locale,
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
                  <Check size={16} color={colors.success.c50} />
                  <LText
                    style={[styles.assetsRemaining]}
                    color={colors.success.c50}
                    testID="cosmos-all-assets-used-text"
                  >
                    <Trans i18nKey={`cosmos.${mode}.flow.steps.amount.allAssetsUsed`} />
                  </LText>
                </View>
              )}
              {max.gt(0) && !isAmountOutOfRange && !isNotEnoughBalance && (
                <View style={styles.labelContainer}>
                  <LText style={styles.assetsRemaining} testID="cosmos-assets-remaining">
                    <Trans
                      i18nKey="cosmos.delegation.flow.steps.amount.assetsRemaining"
                      values={{
                        amount: formatCurrencyUnit(unit, max, {
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
              {!isAmountOutOfRange && !isNotEnoughBalance && redelegatedBalance.gt(0) && (
                <View style={[styles.labelContainer, styles.labelSmall]}>
                  <LText style={[styles.assetsRemaining, styles.small]}>
                    <Trans
                      i18nKey="cosmos.redelegation.flow.steps.amount.newRedelegatedBalance"
                      values={{
                        amount: formatCurrencyUnit(unit, redelegatedBalance.plus(value), {
                          showCode: true,
                          locale: locale,
                        }),
                        name: route.params.validator?.name ?? "",
                      }}
                    >
                      <LText semiBold>{""}</LText>
                    </Trans>
                  </LText>
                </View>
              )}
              <Button
                disabled={isAmountOutOfRange || isNotEnoughBalance}
                event="Cosmos DelegationAmountContinueBtn"
                onPress={onNext}
                title={<Trans i18nKey="cosmos.delegation.flow.steps.amount.cta" />}
                type="primary"
                testID="cosmos-delegation-amount-continue"
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
