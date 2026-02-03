import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import {
  ICP_FEES,
  ICP_MIN_STAKING_AMOUNT,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import type { ICPAccount, ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { Account } from "@ledgerhq/types-live";
import { useNavigation, useTheme } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BigNumber } from "bignumber.js";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import Circle from "~/components/Circle";
import DelegationDrawer from "~/components/DelegationDrawer";
import LText from "~/components/LText";
import { NavigatorName, ScreenName } from "~/const";
import IlluRewards from "~/icons/images/Rewards";
import { urls } from "~/utils/urls";
import { rgba } from "../../../colors";
import { useNeuronDrawerActions, useNeuronDrawerData } from "../components/useNeuronDrawer";
import type { NeuronActionType } from "../NeuronManageFlow/types";
import LabelRight from "./LabelRight";
import NeuronRow from "./NeuronRow";
import StakeBanners from "./StakeBanners";

type Props = {
  account: Account;
};

function StakingPositions({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account) as ICPAccount;
  const neurons = mainAccount.neurons?.fullNeurons || [];
  const currency = getAccountCurrency(mainAccount);
  const unit = useAccountUnit(account);
  const navigation = useNavigation();

  const [selectedNeuron, setSelectedNeuron] = useState<ICPNeuron | null>(null);

  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: string;
      screen?: string;
      params?: { [key: string]: unknown };
    }) => {
      setSelectedNeuron(null);
      (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(route, {
        screen,
        params: { ...params, accountId: account.id },
      });
    },
    [navigation, account.id],
  );

  const onStake = useCallback(() => {
    onNavigate({
      route: NavigatorName.InternetComputerStakingFlow,
      screen:
        neurons.length > 0
          ? ScreenName.InternetComputerStakingAmount
          : ScreenName.InternetComputerStakingStarted,
    });
  }, [onNavigate, neurons.length]);

  const onNeuronAction = useCallback(
    (actionType: NeuronActionType, params?: { autoStakeMaturity?: boolean }) => {
      if (!selectedNeuron) return;
      const neuronId = selectedNeuron.id?.[0]?.id?.toString();
      if (!neuronId) return;

      const baseParams = { neuronId, accountId: account.id };

      switch (actionType) {
        case "set_dissolve_delay":
          onNavigate({
            route: NavigatorName.InternetComputerNeuronManageFlow,
            screen: ScreenName.InternetComputerNeuronSetDissolveDelay,
            params: baseParams,
          });
          break;
        case "add_hot_key":
          onNavigate({
            route: NavigatorName.InternetComputerNeuronManageFlow,
            screen: ScreenName.InternetComputerNeuronAddHotKey,
            params: baseParams,
          });
          break;
        case "stake_maturity":
          onNavigate({
            route: NavigatorName.InternetComputerNeuronManageFlow,
            screen: ScreenName.InternetComputerNeuronStakeMaturity,
            params: baseParams,
          });
          break;
        case "remove_hot_key":
          onNavigate({
            route: NavigatorName.InternetComputerNeuronManageFlow,
            screen: ScreenName.InternetComputerNeuronRemoveHotKey,
            params: baseParams,
          });
          break;
        case "follow":
          onNavigate({
            route: NavigatorName.InternetComputerNeuronManageFlow,
            screen: ScreenName.InternetComputerNeuronFollowSelectTopic,
            params: baseParams,
          });
          break;
        default:
          onNavigate({
            route: NavigatorName.InternetComputerNeuronManageFlow,
            screen: ScreenName.InternetComputerNeuronAction,
            params: { ...baseParams, actionType, ...params },
          });
      }
    },
    [onNavigate, selectedNeuron, account.id],
  );

  // Use reusable hooks for drawer data and actions
  const { drawerData, resetCopiedState } = useNeuronDrawerData({
    neuron: selectedNeuron,
    unit,
  });

  const actions = useNeuronDrawerActions({
    neuron: selectedNeuron,
    onNeuronAction,
  });

  const onCloseDrawer = useCallback(() => {
    setSelectedNeuron(null);
    resetCopiedState();
  }, [resetCopiedState]);

  const canStakeMore = useMemo(() => {
    const spendable = mainAccount.spendableBalance.minus(ICP_FEES);
    return spendable.gte(ICP_MIN_STAKING_AMOUNT);
  }, [mainAccount.spendableBalance]);

  const stakingDisabled = !canStakeMore;

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={!!selectedNeuron && drawerData.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <Circle size={size} bg={rgba(colors.primary, 0.2)}>
            <LText semiBold style={{ fontSize: size / 3 }}>
              N
            </LText>
          </Circle>
        )}
        amount={
          selectedNeuron
            ? new BigNumber(selectedNeuron.cached_neuron_stake_e8s?.toString() || "0")
            : new BigNumber(0)
        }
        data={drawerData}
        actions={actions}
      />

      {neurons.length === 0 ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("icp.staking.emptyState.description", {
            name: account.currency.name,
          })}
          infoUrl={urls.internetComputer.stakingRewards}
          infoTitle={t("icp.staking.emptyState.learnMore")}
          onPress={onStake}
          ctaTitle={t("account.delegation.info.cta")}
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("icp.staking.sectionLabel")}
            RightComponent={<LabelRight disabled={stakingDisabled} onPress={onStake} />}
          />
          {neurons.map((neuron, i) => (
            <View key={neuron.id?.[0]?.id?.toString() || i} style={styles.neuronsWrapper}>
              <NeuronRow
                neuron={neuron}
                currency={currency}
                onPress={() => setSelectedNeuron(neuron)}
                isLast={i === neurons.length - 1}
              />
            </View>
          ))}
          <StakeBanners account={mainAccount} />
        </View>
      )}
    </View>
  );
}

export default function ICPStakingPositions(props: Props) {
  const { account } = props as { account: ICPAccount };
  if (!account.neurons) return null;
  return <StakingPositions account={account} />;
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  wrapper: {
    marginBottom: 16,
  },
  neuronsWrapper: {
    borderRadius: 4,
  },
});
