import React, { useCallback, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
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

import Button from "../../../../../components/Button";
import LText from "../../../../../components/LText";
import { ScreenName } from "../../../../../const";
import ToggleButton from "../../../../../components/ToggleButton";

import InfoModal from "../../../../../modals/Info";
import Info from "../../../../../icons/Info";
import CurrencyUnitValue from "../../../../../components/CurrencyUnitValue";
import CounterValue from "../../../../../components/CounterValue";
import FirstLetterIcon from "../../../../../components/FirstLetterIcon";
import TranslatedError from "../../../../../components/TranslatedError";

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

function ClaimRewardsAmount({ navigation, route }: any) {
  const { colors } = useTheme();

  const account = route.params.account;
  const bridge = getAccountBridge(account);
  const mainAccount = getMainAccount(account);
  const unit = getAccountUnit(mainAccount);
  const currency = getAccountCurrency(mainAccount);

  const { transaction, status, updateTransaction } = useBridgeTransaction(
    () => {
      const transaction = route.params.transaction;

      if (!transaction) {
        return {
          account,
          transaction: bridge.updateTransaction(
            bridge.createTransaction(mainAccount),
            {
              mode: "claimRewards",
              recipient: route.params.contract,
              amount: BigNumber(route.params.value),
            },
          ),
        };
      }

      return {
        account,
        transaction,
      };
    },
  );

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.ElrondClaimRewardsSelectDevice, {
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
  const name = route.params.validator
    ? route.params.validator.name
    : route.params.contract || "";

  const mode = transaction.mode ? transaction.mode : "";

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
        <ToggleButton value={mode} options={options} onChange={onChangeMode} />

        <TouchableOpacity onPress={openInfoModal} style={styles.info}>
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
              showCode={true}
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
        isOpened={!!infoModalOpen}
        onClose={closeInfoModal}
        data={infoModalData}
      />
    </SafeAreaView>
  );
}

export default ClaimRewardsAmount;
