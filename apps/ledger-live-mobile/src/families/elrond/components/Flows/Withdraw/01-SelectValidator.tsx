// @flow
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";

import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  getAccountUnit,
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";

import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { useTheme } from "@react-navigation/native";
import Button from "../../../../../components/Button";
import LText from "../../../../../components/LText";
import { ScreenName } from "../../../../../const";

import CurrencyUnitValue from "../../../../../components/CurrencyUnitValue";
import CounterValue from "../../../../../components/CounterValue";
import FirstLetterIcon from "../../../../../components/FirstLetterIcon";
import TranslatedError from "../../../../../components/TranslatedError";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  footer: {
    alignSelf: "stretch",
    padding: 16,
  },
  spacer: {
    flex: 1,
  },
  info: {
    flexShrink: 1,
    marginTop: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    marginRight: 10,
  },
  sectionLabel: {
    paddingVertical: 12,
  },
  label: {
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  value: {
    fontSize: 20,
    paddingBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    textAlign: "center",
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "center",
  },
  desc: {
    textAlign: "center",
  },
  warning: {
    textAlign: "center",
  },
  warningSection: {
    padding: 16,
    height: 80,
  },
});

function WithdrawAmount({ navigation, route }: any) {
  const { colors } = useTheme();

  const account = route.params.account;
  const bridge = getAccountBridge(account);
  const mainAccount = getMainAccount(account);
  const unit = getAccountUnit(mainAccount);
  const currency = getAccountCurrency(mainAccount);

  const { transaction, status } = useBridgeTransaction(() => {
    const transaction = route.params.transaction;

    if (!transaction) {
      return {
        account,
        transaction: bridge.updateTransaction(
          bridge.createTransaction(mainAccount),
          {
            mode: "withdraw",
            recipient: route.params.contract,
            amount: BigNumber(route.params.amount),
          },
        ),
      };
    }

    return {
      account,
      transaction,
    };
  });

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.ElrondWithdrawSelectDevice, {
      ...route.params,
      transaction,
    });
  }, [navigation, transaction, route]);

  const value = route.params.amount;
  const name = route.params.validator
    ? route.params.validator.name
    : route.params.contract || "";

  const error =
    status.errors &&
    Object.keys(status.errors).length > 0 &&
    Object.values(status.errors)[0];

  const warning =
    status.warnings &&
    Object.keys(status.warnings).length > 0 &&
    Object.values(status.warnings)[0];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.main}>
        <View style={styles.sectionLabel}>
          <LText semiBold={true} style={styles.subLabel} color="grey">
            <Trans i18nKey="elrond.withdraw.flow.steps.method.youEarned" />
          </LText>

          <LText semiBold={true} style={[styles.label, styles.value]}>
            <CurrencyUnitValue unit={unit} value={value} showCode={true} />
          </LText>

          <LText semiBold={true} style={styles.subLabel} color="grey">
            <CounterValue
              currency={currency}
              showCode={true}
              value={value}
              withPlaceholder={true}
            />
          </LText>
        </View>

        <View style={styles.sectionLabel}>
          <LText semiBold={true} style={styles.subLabel} color="grey">
            <Trans i18nKey="elrond.withdraw.flow.steps.method.byDelegationAssetsTo" />
          </LText>

          <View style={styles.row}>
            <FirstLetterIcon label={name} />

            <LText semiBold={true} style={styles.label}>
              {name}
            </LText>
          </View>
        </View>

        <View style={styles.sectionLabel}>
          <LText style={styles.desc}>
            <Trans i18nKey={`elrond.withdraw.flow.steps.method.withdrawInfo`} />
          </LText>
        </View>

        <View style={styles.spacer} />
      </View>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <View style={styles.warningSection}>
          {error && error instanceof Error ? (
            <LText
              selectable={true}
              secondary={true}
              semiBold={true}
              style={styles.warning}
              color="alert"
            >
              <TranslatedError error={error} />
            </LText>
          ) : warning && warning instanceof Error ? (
            <LText
              selectable={true}
              secondary={true}
              semiBold={true}
              style={styles.warning}
              color="alert"
            >
              <TranslatedError error={warning} />
            </LText>
          ) : null}
        </View>

        <Button
          disabled={error instanceof Error}
          event="Elrond WithdrawAmountContinueBtn"
          onPress={onNext}
          title={<Trans i18nKey="elrond.withdraw.flow.steps.method.cta" />}
          type="primary"
        />
      </View>
    </SafeAreaView>
  );
}

export default WithdrawAmount;
