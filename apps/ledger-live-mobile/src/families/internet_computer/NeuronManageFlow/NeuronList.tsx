import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { ICPAccount, ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { FlatList, Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { TrackScreen, track } from "~/analytics";
import Circle from "~/components/Circle";
import DelegationDrawer from "~/components/DelegationDrawer";
import LText from "~/components/LText";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import ExternalLink from "~/icons/ExternalLink";
import IlluRewards from "~/icons/images/Rewards";
import { accountScreenSelector } from "~/reducers/accounts";
import { urls } from "~/utils/urls";
import { rgba } from "../../../colors";
import SyncFooter from "../components/SyncFooter";
import { useNeuronDrawerActions, useNeuronDrawerData } from "../components/useNeuronDrawer";
import NeuronRow from "../Staking/NeuronRow";
import type { InternetComputerNeuronManageFlowParamList, NeuronActionType } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronList
  >
>;

export default function NeuronList({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount) as ICPAccount;
  const bridge = getAccountBridge(account);
  const neurons = mainAccount.neurons?.fullNeurons || [];
  const currency = getAccountCurrency(mainAccount);
  const unit = useAccountUnit(account);
  const lastUpdatedMSecs = mainAccount.neurons?.lastUpdatedMSecs;

  const [selectedNeuron, setSelectedNeuron] = useState<ICPNeuron | null>(null);

  // Create list_neurons transaction for sync
  const { transaction, status } = useBridgeTransaction(() => {
    const tx = bridge.createTransaction(mainAccount);
    return {
      account,
      transaction: bridge.updateTransaction(tx, {
        type: "list_neurons",
      }),
    };
  });

  const onSync = useCallback(() => {
    track("buttonClicked", { button: "sync_neurons", currency: "ICP" });
    if (!transaction) return;

    // Navigate to device selection to sign list_neurons transaction
    navigation.navigate(ScreenName.InternetComputerNeuronSelectDevice, {
      ...route.params,
      transaction,
      status,
    });
  }, [navigation, route.params, transaction, status]);

  const onNeuronAction = useCallback(
    (actionType: NeuronActionType, params?: { autoStakeMaturity?: boolean }) => {
      if (!selectedNeuron) return;
      const neuronId = selectedNeuron.id?.[0]?.id?.toString();
      if (!neuronId) return;

      setSelectedNeuron(null);

      const baseParams = { ...route.params, neuronId };

      switch (actionType) {
        case "set_dissolve_delay":
          navigation.navigate(ScreenName.InternetComputerNeuronSetDissolveDelay, baseParams);
          break;
        case "add_hot_key":
          navigation.navigate(ScreenName.InternetComputerNeuronAddHotKey, baseParams);
          break;
        case "stake_maturity":
          navigation.navigate(ScreenName.InternetComputerNeuronStakeMaturity, baseParams);
          break;
        case "remove_hot_key":
          navigation.navigate(ScreenName.InternetComputerNeuronRemoveHotKey, baseParams);
          break;
        case "follow":
          navigation.navigate(ScreenName.InternetComputerNeuronFollowSelectTopic, baseParams);
          break;
        default:
          navigation.navigate(ScreenName.InternetComputerNeuronAction, {
            ...baseParams,
            actionType,
            ...params,
          });
      }
    },
    [navigation, route.params, selectedNeuron],
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

  const renderItem = useCallback(
    ({ item, index }: { item: ICPNeuron; index: number }) => (
      <NeuronRow
        neuron={item}
        currency={currency}
        onPress={() => setSelectedNeuron(item)}
        isLast={index === neurons.length - 1}
      />
    ),
    [currency, neurons.length],
  );

  const keyExtractor = useCallback(
    (item: ICPNeuron, index: number) => item.id?.[0]?.id?.toString() || index.toString(),
    [],
  );

  // Sort neurons by stake amount (highest first)
  const sortedNeurons = useMemo(
    () =>
      [...neurons].sort(
        (a, b) => Number(b.cached_neuron_stake_e8s) - Number(a.cached_neuron_stake_e8s),
      ),
    [neurons],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
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

      <TrackScreen
        category="ICP Neuron Management"
        name="NeuronList"
        flow="manage"
        action="neuron_management"
        currency="internet_computer"
      />

      {neurons.length === 0 ? (
        <>
          <View style={styles.emptyStateContainer}>
            <IlluRewards style={styles.illustration} />
            <LText semiBold style={styles.emptyStateTitle}>
              {t("icp.neuronManage.list.emptyTitle")}
            </LText>
            <LText style={styles.emptyStateDescription} color="grey">
              {t("icp.neuronManage.list.emptyDescription")}
            </LText>
            <TouchableOpacity
              style={styles.infoLinkContainer}
              onPress={() => Linking.openURL(urls.internetComputer.stakingRewards)}
            >
              <LText bold style={styles.infoLink} color="live">
                {t("icp.neuronManage.list.learnMore")}
              </LText>
              <ExternalLink size={11} color={colors.live} />
            </TouchableOpacity>
          </View>
          <SyncFooter lastUpdatedMSecs={lastUpdatedMSecs} onSync={onSync} />
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text variant="h5" fontWeight="semiBold">
              <Trans i18nKey="icp.neuronManage.list.subtitle" />
            </Text>
            <Text variant="body" color="neutral.c70" mt={2}>
              <Trans i18nKey="icp.neuronManage.list.description" />
            </Text>
          </View>

          <FlatList
            data={sortedNeurons}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />

          <SyncFooter lastUpdatedMSecs={lastUpdatedMSecs} onSync={onSync} />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  emptyStateContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    alignSelf: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: "center",
    paddingVertical: 4,
  },
  emptyStateDescription: {
    fontSize: 14,
    lineHeight: 17,
    paddingVertical: 8,
    textAlign: "center",
  },
  infoLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLink: {
    fontSize: 13,
    lineHeight: 22,
    paddingVertical: 8,
    textAlign: "center",
    marginRight: 6,
  },
});
