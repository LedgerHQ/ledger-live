// @flow
import React, { useCallback, useState, useMemo } from "react";
import { View, StyleSheet, Keyboard, TouchableOpacity } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";

import { useTheme } from "@react-navigation/native";
import { localeSelector } from "../../../reducers/settings";
import Button from "../../../components/Button";
import CurrencyInput from "../../../components/CurrencyInput";
import LText from "../../../components/LText";
import Warning from "../../../icons/Warning";
import Check from "../../../icons/Check";
import KeyboardView from "../../../components/KeyboardView";

import { constants } from "../constants";
import { nominate } from "../helpers";

interface Props {
  navigation: any;
  route: { params: any };
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
  inputStyle: {
    textAlign: "center",
    fontSize: 25,
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
  ratioLabel: { textAlign: "center" },
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
  wrongUndelegations: {
    paddingHorizontal: 10,
    lineHeight: 20,
    textAlign: "center",
  },
  small: {
    fontSize: 11,
    lineHeight: 16,
  },
});

const Amount = (props: Props) => {
  const { navigation, route } = props;
  const { colors } = useTheme();

  const account = route.params.account;
  const locale = useSelector(localeSelector);

  const bridge = getAccountBridge(account);
  const unit = getAccountUnit(account);
  const mode = route.params.mode || "delegation";

  const initialMax = useMemo(() => BigNumber(route.params.max || 0), [route]);
  const initialValue = useMemo(() => BigNumber(route.params.value || 0), [
    route,
  ]);

  const [value, setValue] = useState(initialValue);
  const min = useMemo(() => route.params.min || BigNumber(0), [route]);
  const max = useMemo(() => initialMax.minus(value.minus(initialValue)), [
    initialValue,
    initialMax,
    value,
  ]);

  const onNext = useCallback(() => {
    const transaction = bridge.updateTransaction(route.params.transaction, {
      amount: BigNumber(value),
      recipient: route.params.validator,
    });

    navigation.navigate(route.params.nextScreen, {
      ...route.params,
      transaction,
      recipient: transaction.recipient,
      amount: transaction.amount,
      fromSelectAmount: true,
    });
  }, [navigation, route.params, bridge, value]);

  const [ratioButtons] = useState(
    [0.25, 0.5, 0.75, 1].map(ratio => ({
      label: `${ratio * 100}%`,
      value: initialMax
        .plus(initialValue)
        .multipliedBy(ratio)
        .integerValue(),
    })),
  );

  const minimum = useMemo(() => {
    if (route.params.transaction.mode === "unDelegate") {
      const total = route.params.delegations
        .filter(
          delegation =>
            delegation.contract === route.params.transaction.recipient,
        )
        .reduce(
          (total, delegation) => total.plus(delegation.userActiveStake),
          BigNumber(0),
        )
        .minus(value);

      return total.lt(BigNumber(nominate("1"))) && !total.isEqualTo(0);
    }
  }, [route.params.transaction, route.params.delegations, value]);

  const error = useMemo(() => max.lt(0) || value.lt(min), [value, max, min]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardView>
        <View style={styles.main}>
          <CurrencyInput
            unit={unit}
            value={value}
            onChange={setValue}
            inputStyle={styles.inputStyle}
            hasError={error}
            autoFocus={true}
          />

          <View style={styles.ratioButtonContainer}>
            {ratioButtons.map(button => (
              <TouchableOpacity
                key={button.label}
                style={[
                  styles.ratioButton,
                  value.eq(button.value)
                    ? {
                        borderColor: colors.live,
                        backgroundColor: colors.live,
                      }
                    : { borderColor: colors.grey },
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  setValue(button.value);
                }}
              >
                <LText
                  style={[styles.ratioLabel]}
                  color={value.eq(button.value) ? "white" : "grey"}
                >
                  {button.label}
                </LText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          {error && !value.eq(0) && (
            <View style={styles.labelContainer}>
              <Warning size={16} color={colors.alert} />
              <LText style={[styles.assetsRemaining]} color="alert">
                <Trans
                  i18nKey={
                    value.lt(min)
                      ? "elrond.delegation.flow.steps.amount.minAmount"
                      : "elrond.delegation.flow.steps.amount.incorrectAmount"
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

          {minimum && (
            <View style={styles.labelContainer}>
              <LText style={[styles.wrongUndelegations]} color="alert">
                <Trans
                  i18nKey="elrond.delegation.flow.steps.amount.wrongUndelegations"
                  values={{ label: constants.egldLabel }}
                />
              </LText>
            </View>
          )}

          {max.isZero() && (
            <View style={styles.labelContainer}>
              <Check size={16} color={colors.success} />
              <LText style={[styles.assetsRemaining]} color="success">
                <Trans
                  i18nKey={`elrond.${mode}.flow.steps.amount.allAssetsUsed`}
                />
              </LText>
            </View>
          )}

          {max.gt(0) && !error && (
            <View style={styles.labelContainer}>
              <LText style={styles.assetsRemaining}>
                <Trans
                  i18nKey="elrond.delegation.flow.steps.amount.assetsRemaining"
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

          <Button
            disabled={error || minimum}
            event="Elrond DelegationAmountContinueBtn"
            onPress={onNext}
            title={<Trans i18nKey="elrond.delegation.flow.steps.amount.cta" />}
            type="primary"
          />
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
};

export default Amount;
