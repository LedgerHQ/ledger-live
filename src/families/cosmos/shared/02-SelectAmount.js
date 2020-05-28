// @flow
import invariant from "invariant";
import React, { useCallback, useState, useMemo } from "react";
import { View, StyleSheet, Keyboard } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";

import type {
  CosmosValidatorItem,
  Transaction,
} from "@ledgerhq/live-common/lib/families/cosmos/types";

import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";

import { accountScreenSelector } from "../../../reducers/accounts";
import colors from "../../../colors";
import Button from "../../../components/Button";
import CurrencyInput from "../../../components/CurrencyInput";
import LText from "../../../components/LText";
import Warning from "../../../icons/Warning";
import Check from "../../../icons/Check";

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  validator: CosmosValidatorItem,
  validatorSrc?: CosmosValidatorItem,
  min?: BigNumber,
  max?: BigNumber,
  value?: BigNumber,
  redelegatedBalance?: BigNumber,
  nextScreen: string,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

function DelegationAmount({ navigation, route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));

  invariant(
    account && account.cosmosResources && route.params.transaction,
    "account and cosmos transaction required",
  );

  const bridge = getAccountBridge(account, undefined);
  const unit = getAccountUnit(account);

  const initialValue = useMemo(() => route?.params?.value ?? BigNumber(0), [
    route,
  ]);

  const redelegatedBalance = useMemo(
    () => route?.params?.redelegatedBalance ?? BigNumber(0),
    [route],
  );

  const [value, setValue] = useState(() => initialValue);

  const initialMax = useMemo(() => route?.params?.max ?? BigNumber(0), [route]);

  const max = useMemo(() => initialMax.minus(value.minus(initialValue)), [
    initialValue,
    initialMax,
    value,
  ]);

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
      validators.push({ address: validatorAddress, amount: value });
    }

    const transaction = bridge.updateTransaction(tx, {
      validators,
    });

    navigation.navigate(route.params.nextScreen, {
      ...route.params,
      transaction,
    });
  }, [navigation, route.params, bridge, value]);

  const [ratioButtons] = useState(
    [0.25, 0.5, 0.75, 1].map(ratio => ({
      label: `${ratio * 100}%`,
      value: initialMax.plus(initialValue).multipliedBy(ratio),
    })),
  );

  const error = useMemo(() => max.lt(0) || value.lt(min), [value, max, min]);

  return (
    <SafeAreaView style={styles.root}>
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
            <Button
              containerStyle={styles.ratioButton}
              event=""
              type={value.eq(v) ? "primary" : "secondary"}
              title={label}
              onPress={() => {
                Keyboard.dismiss();
                setValue(v);
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        {error && (
          <View style={styles.labelContainer}>
            <Warning size={16} color={colors.alert} />
            <LText style={[styles.assetsRemaining, styles.error]}>
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
                  }),
                  max: formatCurrencyUnit(unit, initialMax, {
                    showCode: true,
                    showAllDigits: true,
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
            <Check size={16} color={colors.success} />
            <LText style={[styles.assetsRemaining, styles.success]}>
              <Trans i18nKey="cosmos.delegation.flow.steps.amount.allAssetsUsed" />
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
          title={<Trans i18nKey="cosmos.delegation.flow.steps.amount.cta" />}
          type="primary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inputStyle: { textAlign: "center", fontSize: 40, fontWeight: "600" },
  ratioButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
    height: 36,
    marginTop: 16,
  },
  ratioButton: { marginHorizontal: 5 },
  footer: {
    alignSelf: "stretch",
    padding: 16,
    backgroundColor: colors.white,
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
    fontSize: 16,
    textAlign: "center",
    lineHeight: 32,
    paddingHorizontal: 10,
  },
  small: {
    fontSize: 11,
    lineHeight: 16,
  },
  error: {
    color: colors.alert,
  },
  success: {
    color: colors.success,
  },
});

export default DelegationAmount;
