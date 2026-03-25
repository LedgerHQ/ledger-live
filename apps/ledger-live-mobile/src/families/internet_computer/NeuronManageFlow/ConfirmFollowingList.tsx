import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { ICPAccount, ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { getSecondsTillVotingPowerExpires } from "@ledgerhq/live-common/families/internet_computer/utils";
import useBridgeTransaction from "@ledgerhq/live-common/lib-es/bridge/useBridgeTransaction";
import { Button, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { track, TrackScreen } from "~/analytics";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import ConfirmFollowingRow from "./ConfirmFollowingRow";
import { formatLastSyncDate } from "../utils";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronConfirmFollowingList
  >
>;

type NeuronWithExpiry = {
  neuron: ICPNeuron;
  secondsTillExpires: number;
};

export default function ConfirmFollowingList({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount) as ICPAccount;
  const bridge = getAccountBridge(account);
  const neurons = mainAccount.neurons?.fullNeurons || [];
  const lastUpdatedMSecs = mainAccount.neurons?.lastUpdatedMSecs;

  // Filter neurons that have stake or maturity (same as desktop) and add expiry time
  const neuronsNeedingConfirmation = useMemo(() => {
    return neurons
      .filter(n => n.cached_neuron_stake_e8s.toString() !== "0" || n.maturity_e8s_equivalent > 0)
      .map(neuron => ({
        neuron,
        secondsTillExpires: getSecondsTillVotingPowerExpires(neuron),
      }))
      .sort((a, b) => a.secondsTillExpires - b.secondsTillExpires);
  }, [neurons]);

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const onConfirmFollowing = useCallback(
    async (neuron: ICPNeuron) => {
      const neuronId = neuron.id?.[0]?.id?.toString();
      if (!neuronId) return;

      const tx = bridge.createTransaction(mainAccount);
      const transaction = bridge.updateTransaction(tx, {
        type: "refresh_voting_power",
        neuronId,
      });

      // Compute status before navigating
      const status = await bridge.getTransactionStatus(mainAccount, transaction);

      navigation.navigate(ScreenName.InternetComputerNeuronSelectDevice, {
        ...route.params,
        transaction,
        status,
      });
    },
    [bridge, mainAccount, navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: NeuronWithExpiry; index: number }) => (
      <ConfirmFollowingRow
        neuron={item.neuron}
        secondsTillExpires={item.secondsTillExpires}
        onConfirm={() => onConfirmFollowing(item.neuron)}
        isLast={index === neuronsNeedingConfirmation.length - 1}
      />
    ),
    [neuronsNeedingConfirmation.length, onConfirmFollowing],
  );

  const keyExtractor = useCallback(
    (item: NeuronWithExpiry, index: number) =>
      item.neuron.id?.[0]?.id?.toString() || index.toString(),
    [],
  );

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

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ICP Neuron Management"
        name="ConfirmFollowingList"
        flow="manage"
        action="confirm_following"
        currency="internet_computer"
      />

      {neuronsNeedingConfirmation.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={[styles.emptyStateCard, { backgroundColor: colors.card }]}>
            <Text variant="body" color="neutral.c80" textAlign="center" mt={4}>
              <Trans i18nKey="icp.neuronManage.confirmFollowing.noNeurons" />
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button type="main" onPress={onClose} style={styles.button}>
              <Trans i18nKey="common.close" />
            </Button>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text variant="h5" fontWeight="semiBold">
              <Trans i18nKey="icp.neuronManage.confirmFollowing.title" />
            </Text>
            <Text variant="body" color="neutral.c70" mt={2}>
              <Trans i18nKey="icp.neuronManage.confirmFollowing.description" />
            </Text>
          </View>

          <FlatList
            data={neuronsNeedingConfirmation}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <View style={styles.lastSyncContainer}>
              <Text variant="small" color="neutral.c60">
                <Trans i18nKey="icp.neuronManage.list.lastSync" />:{" "}
                {formatLastSyncDate(lastUpdatedMSecs, t("icp.neuronManage.list.lastSyncNever"))}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Button type="shade" outline onPress={onClose} style={styles.button}>
                <Trans i18nKey="common.close" />
              </Button>
              <Button type="main" onPress={onSync} style={styles.button}>
                <Trans i18nKey="icp.neuronManage.list.sync" />
              </Button>
            </View>
          </View>
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
    justifyContent: "center",
  },
  emptyStateCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  lastSyncContainer: {
    marginTop: 24,
    alignItems: "center",
  },
});
