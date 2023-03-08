import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import type {
  CosmosAccount,
  Transaction,
} from "@ledgerhq/live-common/families/cosmos/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  getAccountUnit,
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useTheme } from "@react-navigation/native";
import cosmosBase from "@ledgerhq/live-common/families/cosmos/chain/cosmosBase";
import { accountScreenSelector } from "../../../reducers/accounts";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import { ScreenName } from "../../../const";
import ToggleButton from "../../../components/ToggleButton";
import InfoModal from "../../../modals/Info";
import Info from "../../../icons/Info";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";
import TranslatedError from "../../../components/TranslatedError";
import ValidatorImage from "../shared/ValidatorImage";
import type { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import type { CosmosClaimRewardsFlowParamList } from "./types";

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

type Props = StackNavigatorProps<
  CosmosClaimRewardsFlowParamList,
  ScreenName.CosmosClaimRewardsMethod
>;

function ClaimRewardsAmount({ navigation, route }: Props) {
  const { colors } = useTheme();
  const account = useSelector(accountScreenSelector(route))
    .account as CosmosAccount;
  invariant(
    account && account.cosmosResources,
    "account and cosmos transaction required",
  );
  const bridge = getAccountBridge(account, undefined);
  const mainAccount = getMainAccount(account, undefined);
  const unit = getAccountUnit(mainAccount);
  const currency = getAccountCurrency(mainAccount);
  const bridgeTransaction = useBridgeTransaction(() => {
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
        }),
      };
    }

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

    return {
      account,
      transaction: tx,
    };
  });
  const { status, updateTransaction } = bridgeTransaction;
  const transaction = bridgeTransaction.transaction as Transaction;
  invariant(transaction, "transaction required");
  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.CosmosClaimRewardsSelectDevice, {
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
  const [infoModalOpen, setInfoModalOpen] = useState<boolean>();
  const openInfoModal = useCallback(() => {
    setInfoModalOpen(true);
  }, [setInfoModalOpen]);
  const closeInfoModal = useCallback(() => {
    setInfoModalOpen(false);
  }, [setInfoModalOpen]);
  const value = route.params.value;
  const name =
    route.params.validator?.name ??
    route.params.validator?.validatorAddress ??
    "";
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
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.main}>
        <ToggleButton value={mode} options={options} onChange={onChangeMode} />
        <TouchableOpacity onPress={openInfoModal} style={styles.info}>
          <LText semiBold style={styles.infoLabel} color="grey">
            <Trans i18nKey="cosmos.claimRewards.flow.steps.method.compoundOrCashIn" />
          </LText>
          <Info size={16} color={colors.grey} />
        </TouchableOpacity>
        <View style={styles.spacer} />
        <View style={styles.sectionLabel}>
          <LText semiBold style={styles.subLabel} color="grey">
            <Trans i18nKey="cosmos.claimRewards.flow.steps.method.youEarned" />
          </LText>
          <LText semiBold style={[styles.label, styles.value]}>
            <CurrencyUnitValue unit={unit} value={value} showCode />
          </LText>
          <LText semiBold style={styles.subLabel} color="grey">
            <CounterValue
              currency={currency}
              showCode
              value={value}
              withPlaceholder
            />
          </LText>
        </View>
        <View style={styles.sectionLabel}>
          <LText semiBold style={styles.subLabel} color="grey">
            <Trans i18nKey="cosmos.claimRewards.flow.steps.method.byDelegationAssetsTo" />
          </LText>
          <View style={styles.row}>
            <ValidatorImage
              size={38}
              isLedger={cosmosBase.COSMOS_FAMILY_LEDGER_VALIDATOR_ADDRESSES.includes(
                route.params.validator?.validatorAddress,
              )}
              name={name}
            />
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
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.warningSection}>
          {error && error instanceof Error ? (
            <LText
              selectable
              secondary
              semiBold
              style={styles.warning}
              color="alert"
            >
              <TranslatedError error={error} />
            </LText>
          ) : warning && warning instanceof Error ? (
            <LText
              selectable
              secondary
              semiBold
              style={styles.warning}
              color="alert"
            >
              <TranslatedError error={warning} />
            </LText>
          ) : null}
        </View>
        <Button
          disabled={error instanceof Error}
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
    alignItems: "center",
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
export default ClaimRewardsAmount;
