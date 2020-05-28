// @flow
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";

import type {
  CosmosValidatorItem,
  Transaction,
} from "@ledgerhq/live-common/lib/families/cosmos/types";

import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import {
  getAccountUnit,
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/lib/account";

import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { accountScreenSelector } from "../../../reducers/accounts";
import colors from "../../../colors";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import { ScreenName } from "../../../const";
import ToggleButton from "../../../components/ToggleButton";

import InfoModal from "../../../modals/Info";
import Info from "../../../icons/Info";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";
import FirstLetterIcon from "../../../components/FirstLetterIcon";

const options = [
  {
    value: "claimRewardCompound",
    label: (
      <Trans i18nKey="cosmos.claimRewards.flow.steps.method.claimRewardCompound" />
    ),
  },
  {
    value: "claimReward",
    label: (
      <Trans i18nKey="cosmos.claimRewards.flow.steps.method.claimReward" />
    ),
  },
];

const infoModalData = [
  {
    title: (
      <Trans i18nKey="cosmos.claimRewards.flow.steps.method.claimRewardCompound" />
    ),
    description: (
      <Trans i18nKey="cosmos.claimRewards.flow.steps.method.claimRewardCompoundTooltip" />
    ),
  },
  {
    title: (
      <Trans i18nKey="cosmos.claimRewards.flow.steps.method.claimReward" />
    ),
    description: (
      <Trans i18nKey="cosmos.claimRewards.flow.steps.method.claimRewardTooltip" />
    ),
  },
];

type RouteParams = {
  accountId: string,
  transaction?: Transaction,
  validator: CosmosValidatorItem,
  value: BigNumber,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

function ClaimRewardsAmount({ navigation, route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));

  invariant(
    account && account.cosmosResources,
    "account and cosmos transaction required",
  );

  const bridge = getAccountBridge(account, undefined);
  const mainAccount = getMainAccount(account, undefined);
  const unit = getAccountUnit(mainAccount);
  const currency = getAccountCurrency(mainAccount);

  const { transaction, status, updateTransaction } = useBridgeTransaction(
    () => {
      const tx = route.params.transaction;

      if (!tx) {
        const t = bridge.createTransaction(mainAccount);

        return {
          account,
          transaction: bridge.updateTransaction(t, {
            mode: "claimReward",
            validators: [
              {
                address: route.params.validator.validatorAddress,
                amount: route.params.value,
              },
            ],
            /** @TODO remove this once the bridge handles it */
            recipient: mainAccount.freshAddress,
          }),
        };
      }

      return { account, transaction: tx };
    },
  );

  invariant(transaction, "transaction required");

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.CosmosClaimRewardsConnectDevice, {
      ...route.params,
      transaction,
    });
  }, [navigation, transaction, route]);

  const onChangeMode = useCallback(
    mode => {
      updateTransaction(() =>
        bridge.updateTransaction(transaction, {
          mode,
        }),
      );
    },
    [transaction, bridge, updateTransaction],
  );

  const [infoModalOpen, setInfoModalOpen] = useState();

  const openInfoModal = useCallback(() => {
    setInfoModalOpen(true);
  }, [setInfoModalOpen]);

  const closeInfoModal = useCallback(() => {
    setInfoModalOpen(false);
  }, [setInfoModalOpen]);

  const value = route.params.value;
  const name = route.params.validator.name;
  const mode = transaction.mode;

  const error = status.errors && Object.keys(status.errors).length > 0;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.main}>
        <ToggleButton value={mode} options={options} onChange={onChangeMode} />
        <TouchableOpacity onPress={openInfoModal} style={styles.info}>
          <LText semiBold style={styles.infoLabel}>
            <Trans i18nKey="cosmos.claimRewards.flow.steps.method.compoundOrCashIn" />
          </LText>
          <Info size={16} color={colors.grey} />
        </TouchableOpacity>
        <View style={styles.spacer} />
        <View style={styles.sectionLabel}>
          <LText tertiary style={styles.subLabel}>
            <Trans i18nKey="cosmos.claimRewards.flow.steps.method.youEarned" />
          </LText>
          <LText semiBold style={[styles.label, styles.value]}>
            <CurrencyUnitValue unit={unit} value={value} showCode />
          </LText>
          <LText tertiary style={styles.subLabel}>
            <CounterValue
              currency={currency}
              showCode
              value={value}
              withPlaceholder
            />
          </LText>
        </View>
        <View style={styles.sectionLabel}>
          <LText tertiary style={styles.subLabel}>
            <Trans i18nKey="cosmos.claimRewards.flow.steps.method.byDelegationAssetsTo" />
          </LText>
          <View style={styles.row}>
            <FirstLetterIcon label={name} />
            <LText semiBold style={styles.label}>
              {name}
            </LText>
          </View>
        </View>
        <View style={styles.sectionLabel}>
          <LText style={styles.desc}>
            <Trans
              i18nKey={`cosmos.claimRewards.flow.steps.method.${mode}Info`}
            />
          </LText>
        </View>
        <View style={styles.spacer} />
      </View>
      <View style={styles.footer}>
        <Button
          disabled={error}
          event="Cosmos ClaimRewardsAmountContinueBtn"
          onPress={onNext}
          title={<Trans i18nKey="cosmos.claimRewards.flow.steps.method.cta" />}
          type="primary"
        />
      </View>
      <InfoModal
        isOpened={!!infoModalOpen}
        onClose={closeInfoModal}
        data={infoModalData}
      />
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
    paddingHorizontal: 32,
  },
  footer: {
    alignSelf: "stretch",
    padding: 16,
    backgroundColor: colors.white,
  },
  spacer: {
    flex: 1,
  },
  error: {
    color: colors.alert,
  },
  success: {
    color: colors.success,
  },
  info: {
    flexShrink: 1,
    marginTop: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { color: colors.grey, marginRight: 10 },
  sectionLabel: { paddingVertical: 12 },
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
    color: colors.grey,
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
});

export default ClaimRewardsAmount;
