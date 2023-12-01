import React, { useCallback, useMemo, useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { handleTransactionStatus } from "@ledgerhq/live-common/families/elrond/helpers/handleTransactionStatus";
import {
  getAccountUnit,
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { MIN_DELEGATION_AMOUNT } from "@ledgerhq/live-common/families/elrond/constants";

import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { PickMethodPropsType, OptionType, ModalType } from "./types";

import Button from "~/components/Button";
import LText from "~/components/LText";
import ToggleButton from "~/components/ToggleButton";
import InfoModal from "~/modals/Info";
import Info from "~/icons/Info";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import FirstLetterIcon from "~/components/FirstLetterIcon";
import TranslatedError from "~/components/TranslatedError";
import { ScreenName } from "~/const";

import { TransactionMethodEnum } from "./enums";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const PickMethod = (props: PickMethodPropsType) => {
  const [modal, setModal] = useState(false);
  const [mode, setMode] = useState<string>(TransactionMethodEnum.claimRewards);

  const { navigation, route } = props;
  const { account, value, name, recipient } = route.params;
  const { colors } = useTheme();

  const mainAccount = getMainAccount(account, undefined);
  const currency = getAccountCurrency(mainAccount);
  const bridge: AccountBridge<Transaction> = getAccountBridge(account);
  const unit = getAccountUnit(mainAccount);
  const methods = [TransactionMethodEnum.claimRewards, TransactionMethodEnum.reDelegateRewards];

  const currentDelegation = useMemo(
    () => account.elrondResources.delegations.find(delegation => recipient === delegation.contract),
    [account.elrondResources.delegations, recipient],
  );

  /*
   * If the claimable reward amount plus the existing delegation doesn't surpass 1 EGLD, disable the compound option.
   */

  const canCompoundReward = useMemo(
    () =>
      currentDelegation
        ? new BigNumber(currentDelegation.claimableRewards)
            .plus(currentDelegation.userActiveStake)
            .isGreaterThanOrEqualTo(MIN_DELEGATION_AMOUNT)
        : false,
    [currentDelegation],
  );

  /*
   * Initialize the arrays for the modal data and mode options payload.
   */

  const options: OptionType[] = methods.map(method => ({
    value: method,
    label: <Trans i18nKey={`elrond.claimRewards.flow.steps.method.${method}`} />,
    disabled: method === TransactionMethodEnum.reDelegateRewards && !canCompoundReward,
  }));

  const modals: ModalType[] = methods.map(method => ({
    title: <Trans i18nKey={`elrond.claimRewards.flow.steps.method.${method}`} />,
    description: <Trans i18nKey={`elrond.claimRewards.flow.steps.method.${method}Tooltip`} />,
  }));

  /*
   * If no transaction sent through the parameters of the navigation, instantiate a new one, otherwise, return the old one.
   */

  const { transaction, status, updateTransaction } = useBridgeTransaction(() => {
    if (route.params.transaction) {
      return {
        account,
        transaction: route.params.transaction,
      };
    }

    return {
      account,
      transaction: bridge.updateTransaction(bridge.createTransaction(mainAccount), {
        recipient,
        mode: TransactionMethodEnum.claimRewards,
        amount: new BigNumber(value),
      }),
    };
  });

  /*
   * Handle the possible warnings and errors of the transaction status and return the first of each.
   */

  const { warning, error } = useMemo(() => handleTransactionStatus(status), [status]);

  /*
   * Callback called when navigating to the next screen of the current flow.
   */

  const onNext = useCallback(() => {
    navigation.navigate(
      ScreenName.ElrondClaimRewardsSelectDevice,
      Object.assign(route.params, {
        transaction,
        accountId: account.id,
      }),
    );
  }, [navigation, transaction, account, route]);

  /*
   * Handle the mode change callback. Update the state and the transaction mode to either "claimRewards" or "reDelegateRewards".
   */

  const onChangeMode = useCallback(
    (mode: string) => {
      if (transaction) {
        setMode(mode);
        updateTransaction(() => bridge.updateTransaction(transaction, { mode }));
      }
    },
    [transaction, bridge, updateTransaction],
  );

  /*
   * Return the rendered component.
   */

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.main}>
        <ToggleButton value={mode} options={options} onChange={onChangeMode} />

        <TouchableOpacity onPress={() => setModal(true)} style={styles.info}>
          <LText semiBold={true} style={styles.infoLabel} color="grey">
            <Trans i18nKey="elrond.claimRewards.flow.steps.method.compoundOrCashIn" />
          </LText>

          <Info size={16} color={colors.background} />
        </TouchableOpacity>

        <View style={styles.spacer} />

        <View style={styles.sectionLabel}>
          <LText semiBold={true} style={styles.subLabel} color="grey">
            <Trans i18nKey="elrond.claimRewards.flow.steps.method.youEarned" />
          </LText>

          <LText semiBold={true} style={[styles.label, styles.value]}>
            <CurrencyUnitValue unit={unit} value={new BigNumber(value)} showCode={true} />
          </LText>

          <LText semiBold={true} style={styles.subLabel} color="grey">
            <CounterValue currency={currency} value={new BigNumber(value)} withPlaceholder={true} />
          </LText>
        </View>

        <View style={styles.sectionLabel}>
          <LText semiBold={true} style={styles.subLabel} color="grey">
            <Trans i18nKey="elrond.claimRewards.flow.steps.method.byDelegationAssetsTo" />
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
            <Trans i18nKey={`elrond.claimRewards.flow.steps.method.${mode}Info`} />
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
          title={<Trans i18nKey="elrond.claimRewards.flow.steps.method.cta" />}
          type="primary"
        />
      </View>

      <InfoModal isOpened={modal} onClose={() => setModal(false)} data={modals} />
    </View>
  );
};

export default PickMethod;
