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
import type { NearAccount } from "@ledgerhq/live-common/families/near/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useTheme } from "styled-components/native";
import { accountScreenSelector } from "~/reducers/accounts";
import Button from "~/components/Button";
import CurrencyInput from "~/components/CurrencyInput";
import LText from "~/components/LText";
import Check from "~/icons/Check";
import KeyboardView from "~/components/KeyboardView";
import TranslatedError from "~/components/TranslatedError";
import { getFirstStatusError } from "../../helpers";
import { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NearStakingFlowParamList } from "../StakingFlow/types";
import { NearUnstakingFlowParamList } from "../UnstakingFlow/types";
import { NearWithdrawingFlowParamList } from "../WithdrawingFlow/types";
import { useSettings } from "~/hooks";

type Props =
  | StackNavigatorProps<NearStakingFlowParamList, ScreenName.NearStakingAmount>
  | StackNavigatorProps<NearUnstakingFlowParamList, ScreenName.NearUnstakingAmount>
  | StackNavigatorProps<NearWithdrawingFlowParamList, ScreenName.NearWithdrawingAmount>;

function StakingAmount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const account = useSelector(accountScreenSelector(route)).account as NearAccount;
  const { locale } = useSettings();

  invariant(
    account && account.nearResources && route.params.transaction,
    "account and near transaction required",
  );
  const bridge = getAccountBridge(account, undefined);
  const unit = getAccountUnit(account);
  const initialValue = useMemo(() => route?.params?.value ?? new BigNumber(0), [route]);
  const [value, setValue] = useState(() => initialValue);
  const max = useMemo(() => route?.params?.max ?? new BigNumber(0), [route]);
  const remaining = useMemo(() => max.minus(value), [max, value]);
  const { transaction, updateTransaction, bridgePending, status } = route.params;
  const onNext = useCallback(() => {
    const tx = route.params.transaction;

    const transaction = bridge.updateTransaction(tx, {
      amount: value,
      useAllAmount: value.gte(max),
    });
    // @ts-expect-error navigate cannot infer the correct navigator + route
    navigation.navigate(route.params.nextScreen, {
      ...route.params,
      transaction,
      fromSelectAmount: true,
    });
  }, [navigation, route.params, bridge, value, max]);
  const onChange = useCallback(
    (amount: BigNumber) => {
      if (!amount.isNaN()) {
        setValue(amount);
        updateTransaction && updateTransaction(oldTx => ({ ...oldTx, amount }));
      }
    },
    [updateTransaction],
  );
  const [ratioButtons] = useState(
    [0.25, 0.5, 0.75, 1].map(ratio => ({
      label: `${ratio * 100}%`,
      value: max.multipliedBy(ratio).integerValue(),
    })),
  );
  const error =
    transaction.amount.eq(0) || bridgePending ? null : getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");

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
                onChange={onChange}
                inputStyle={styles.inputStyle}
                hasError={!!error}
                hasWarning={!!warning}
              />
              <LText
                style={[styles.fieldStatus]}
                color={error ? "alert" : warning ? "orange" : "darkBlue"}
                numberOfLines={2}
              >
                <TranslatedError error={error || warning} />
              </LText>
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
                      onChange(v);
                    }}
                  >
                    <LText
                      style={[styles.ratioLabel]}
                      color={value.eq(v) ? colors.neutral.c100 : colors.neutral.c60}
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
              {remaining.isZero() && (
                <View style={styles.labelContainer}>
                  <Check size={16} color={colors.success.c50} />
                  <LText style={[styles.assetsRemaining]} color={colors.success.c50}>
                    <Trans i18nKey={`near.staking.flow.steps.amount.allAssetsUsed`} />
                  </LText>
                </View>
              )}
              {remaining.gt(0) && !error && (
                <View style={styles.labelContainer}>
                  <LText style={styles.assetsRemaining}>
                    <Trans
                      i18nKey="near.staking.flow.steps.amount.assetsRemaining"
                      values={{
                        amount: formatCurrencyUnit(unit, remaining, {
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
                disabled={!!bridgePending || !!error}
                pending={bridgePending}
                event="NearStakingAmountContinueBtn"
                onPress={onNext}
                title={<Trans i18nKey="near.staking.flow.steps.amount.cta" />}
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
  fieldStatus: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default StakingAmount;
