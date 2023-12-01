import React, { useCallback, useMemo } from "react";
import { View } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { handleTransactionStatus } from "@ledgerhq/live-common/families/elrond/helpers/handleTransactionStatus";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  getAccountUnit,
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";

import Button from "~/components/Button";
import LText from "~/components/LText";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import FirstLetterIcon from "~/components/FirstLetterIcon";
import TranslatedError from "~/components/TranslatedError";
import { ScreenName } from "~/const";

import type { WithdrawFundsPropsType } from "./types";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const WithdrawFunds = (props: WithdrawFundsPropsType) => {
  const { navigation, route } = props;
  const { amount, account, validator } = route.params;
  const { colors } = useTheme();

  const mainAccount = getMainAccount(account, undefined);
  const currency = getAccountCurrency(mainAccount);
  const bridge = getAccountBridge(account);
  const unit = getAccountUnit(mainAccount);
  const name = validator.identity.name || validator.contract;

  /*
   * Instantiate a new transaction with the given arguments.
   */

  const { transaction, status } = useBridgeTransaction(() => ({
    account,
    transaction: bridge.updateTransaction(bridge.createTransaction(mainAccount), {
      mode: "withdraw",
      recipient: validator.contract,
      amount,
    }),
  }));

  /*
   * Callback called when navigating to the next screen of the current flow.
   */

  const onNext = useCallback(() => {
    if (transaction) {
      navigation.navigate(
        ScreenName.ElrondWithdrawSelectDevice,
        Object.assign(route.params, {
          transaction,
          accountId: account.id,
        }),
      );
    }
  }, [navigation, account, transaction, route]);

  /*
   * Handle the possible warnings and errors of the transaction status and return the first of each.
   */

  const { warning, error } = useMemo(() => handleTransactionStatus(status), [status]);

  /*
   * Return the rendered component.
   */

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.main}>
        <View style={styles.sectionLabel}>
          <LText semiBold={true} style={styles.subLabel} color="grey">
            <Trans i18nKey="elrond.withdraw.flow.steps.method.youEarned" />
          </LText>

          <LText semiBold={true} style={[styles.label, styles.value]}>
            <CurrencyUnitValue unit={unit} value={amount} showCode={true} />
          </LText>

          <LText semiBold={true} style={styles.subLabel} color="grey">
            <CounterValue currency={currency} value={amount} withPlaceholder={true} />
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
            <Trans i18nKey="elrond.withdraw.flow.steps.method.withdrawInfo" />
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
          event="Elrond ClaimRewardsAmountContinueBtn"
          onPress={onNext}
          title={<Trans i18nKey="elrond.withdraw.flow.steps.method.cta" />}
          type="primary"
        />
      </View>
    </View>
  );
};

export default WithdrawFunds;
