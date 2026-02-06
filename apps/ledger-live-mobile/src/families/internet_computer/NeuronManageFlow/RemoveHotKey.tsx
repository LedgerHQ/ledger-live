import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { TrackScreen } from "~/analytics";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import { getFirstStatusError, hasStatusError } from "../../helpers";
import ActionFooter from "../components/ActionFooter";
import NeuronInfoCard from "../components/NeuronInfoCard";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronRemoveHotKey
  >
>;

export default function RemoveHotKey({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount) as ICPAccount;
  const bridge = getAccountBridge(account);
  const unit = useAccountUnit(account);
  const { neuronId } = route.params;

  const neurons = mainAccount.neurons?.fullNeurons || [];
  const neuron = useMemo(
    () => neurons.find(n => n.id?.[0]?.id?.toString() === neuronId),
    [neurons, neuronId],
  );

  // Get hot keys from neuron
  const hotKeys = useMemo(() => {
    if (!neuron?.hot_keys) return [];
    return neuron.hot_keys.map(hk => hk.toString());
  }, [neuron]);

  const [selectedHotKey, setSelectedHotKey] = useState<string | null>(null);

  const { transaction, setTransaction, status, bridgePending, bridgeError } = useBridgeTransaction(
    () => {
      const t = bridge.createTransaction(mainAccount);
      return {
        account,
        transaction: bridge.updateTransaction(t, {
          type: "remove_hot_key",
          neuronId,
          hotKeyToRemove: "",
        }),
      };
    },
  );

  invariant(transaction, "transaction must be defined");

  const onSelectHotKey = useCallback(
    (hotKey: string) => {
      setSelectedHotKey(hotKey);
      setTransaction(
        bridge.updateTransaction(transaction, {
          hotKeyToRemove: hotKey,
        }),
      );
    },
    [bridge, setTransaction, transaction],
  );

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.InternetComputerNeuronSelectDevice, {
      source: route.params.source,
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      status,
    });
  }, [account.id, navigation, parentAccount?.id, route.params.source, status, transaction]);

  const error = bridgePending || !selectedHotKey ? null : getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");
  const hasErrors = hasStatusError(status);

  const isDisabled = useMemo(() => {
    if (bridgePending || !!bridgeError) return true;
    if (!selectedHotKey) return true;
    if (hasErrors && selectedHotKey) return true;
    return false;
  }, [bridgePending, bridgeError, selectedHotKey, hasErrors]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ICP Neuron Management"
        name="RemoveHotKey"
        flow="manage"
        action="remove_hot_key"
        currency="internet_computer"
      />

      <View style={styles.body}>
        <View style={styles.header}>
          <Text variant="h4" fontWeight="semiBold" mb={2}>
            <Trans i18nKey="icp.neuronManage.action.removeHotKey.title" />
          </Text>
          <Text variant="body" color="neutral.c70">
            <Trans i18nKey="icp.neuronManage.action.removeHotKey.description" />
          </Text>
        </View>

        <View style={styles.listSection}>
          <Text variant="body" fontWeight="semiBold" mb={2}>
            <Trans i18nKey="icp.neuronManage.removeHotKey.selectLabel" />
          </Text>

          {hotKeys.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="body" color="neutral.c70">
                <Trans i18nKey="icp.neuronManage.removeHotKey.noHotKeys" />
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list}>
              {hotKeys.map((hotKey, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.hotKeyItem,
                    {
                      borderColor: selectedHotKey === hotKey ? colors.primary : colors.border,
                      backgroundColor:
                        selectedHotKey === hotKey ? `${colors.primary}10` : "transparent",
                    },
                  ]}
                  onPress={() => onSelectHotKey(hotKey)}
                >
                  <Text
                    variant="body"
                    fontWeight={selectedHotKey === hotKey ? "semiBold" : "regular"}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {hotKey}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <NeuronInfoCard neuronId={neuronId} unit={unit} />
      </View>

      <ActionFooter
        error={error}
        warning={warning}
        onContinue={onContinue}
        isDisabled={isDisabled}
        isPending={bridgePending}
        testID="icp-neuron-remove-hotkey-continue"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  listSection: {
    marginBottom: 24,
    flex: 1,
  },
  list: {
    maxHeight: 200,
  },
  hotKeyItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
});
