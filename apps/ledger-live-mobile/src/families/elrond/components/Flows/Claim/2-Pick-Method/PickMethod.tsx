// @flow
import React, { useCallback, useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  getAccountUnit,
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";

import Button from "../../../../../../components/Button";
import LText from "../../../../../../components/LText";
import { ScreenName } from "../../../../../../const";
import ToggleButton from "../../../../../../components/ToggleButton";

import InfoModal from "../../../../../../modals/Info";
import Info from "../../../../../../icons/Info";
import CurrencyUnitValue from "../../../../../../components/CurrencyUnitValue";
import CounterValue from "../../../../../../components/CounterValue";
import FirstLetterIcon from "../../../../../../components/FirstLetterIcon";
import TranslatedError from "../../../../../../components/TranslatedError";

import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";

import styles from "./styles";
import { PickMethodPropsType } from "./types";

const options = [
  {
    value: "reDelegateRewards",
    label: (
      <Trans i18nKey="elrond.claimRewards.flow.steps.method.reDelegateRewards" />
    ),
  },
  {
    value: "claimRewards",
    label: (
      <Trans i18nKey="elrond.claimRewards.flow.steps.method.claimRewards" />
    ),
  },
];

const infoModalData = [
  {
    title: (
      <Trans i18nKey="elrond.claimRewards.flow.steps.method.reDelegateRewards" />
    ),
    description: (
      <Trans i18nKey="elrond.claimRewards.flow.steps.method.reDelegateRewardsTooltip" />
    ),
  },
  {
    title: (
      <Trans i18nKey="elrond.claimRewards.flow.steps.method.claimRewards" />
    ),
    description: (
      <Trans i18nKey="elrond.claimRewards.flow.steps.method.claimRewardsTooltip" />
    ),
  },
];

const PickMethod = (props: PickMethodPropsType) => {
  const [modal, setModal] = useState(false);

  const { navigation, route } = props;
  const { account, value, name, recipient } = route.params;
  const { colors } = useTheme();

  const mainAccount = getMainAccount(account, undefined);
  const currency = getAccountCurrency(mainAccount);
  const bridge: AccountBridge<Transaction> = getAccountBridge(account);
  const unit = getAccountUnit(mainAccount);

  const { transaction, status, updateTransaction } = useBridgeTransaction(
    () => {
      if (route.params.transaction) {
        return {
          account,
          transaction: route.params.transaction,
        };
      }

      return {
        account,
        transaction: bridge.updateTransaction(
          bridge.createTransaction(mainAccount),
          {
            recipient,
            mode: "claimRewards",
            amount: new BigNumber(value),
          },
        ),
      };
    },
  );

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.ElrondClaimRewardsSelectDevice, {
      transaction,
    });
  }, [navigation, transaction, route]);

  const onChangeMode = useCallback(
    (mode: string) => {
      if (transaction) {
        updateTransaction(() =>
          bridge.updateTransaction(transaction, { mode }),
        );
      }
    },
    [transaction, bridge, updateTransaction],
  );

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
        <ToggleButton
          value={transaction ? transaction.mode : ""}
          options={options}
          onChange={onChangeMode}
        />

        <TouchableOpacity onPress={() => setModal(true)} style={styles.info}>
          <LText semiBold={true} style={styles.infoLabel} color="grey">
            <Trans i18nKey="elrond.claimRewards.flow.steps.method.compoundOrCashIn" />
          </LText>

          <Info size={16} color={colors.grey} />
        </TouchableOpacity>

        <View style={styles.spacer} />

        <View style={styles.sectionLabel}>
          <LText semiBold={true} style={styles.subLabel} color="grey">
            <Trans i18nKey="elrond.claimRewards.flow.steps.method.youEarned" />
          </LText>

          <LText semiBold={true} style={[styles.label, styles.value]}>
            <CurrencyUnitValue unit={unit} value={value} showCode={true} />
          </LText>

          <LText semiBold={true} style={styles.subLabel} color="grey">
            <CounterValue
              currency={currency}
              value={value}
              withPlaceholder={true}
            />
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
            <Trans
              i18nKey={`elrond.claimRewards.flow.steps.method.${mode}Info`}
            />
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

      <InfoModal
        isOpened={!!modal}
        onClose={() => setModal(false)}
        data={infoModalData}
      />
    </SafeAreaView>
  );
};

export default PickMethod;
