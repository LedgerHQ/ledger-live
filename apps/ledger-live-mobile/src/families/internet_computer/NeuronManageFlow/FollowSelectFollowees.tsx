import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import {
  KNOWN_NEURON_IDS,
  KNOWN_TOPICS,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import type { ICPAccount, ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { Button, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { TrackScreen } from "~/analytics";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import { getFirstStatusError, hasStatusError } from "../../helpers";
import ActionFooter from "../components/ActionFooter";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronFollowSelectFollowees
  >
>;

const neuronIdsList = Object.entries(KNOWN_NEURON_IDS);

export default function FollowSelectFollowees({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount) as ICPAccount;
  const bridge = getAccountBridge(account);
  const unit = useAccountUnit(account);
  const { neuronId, followTopic } = route.params;

  const neurons = mainAccount.neurons?.fullNeurons || [];
  const neuron = useMemo(
    () => neurons.find((n: ICPNeuron) => n.id?.[0]?.id?.toString() === neuronId),
    [neurons, neuronId],
  );

  // Get initial followees for this topic from the neuron
  const initialFollowees = useMemo(() => {
    if (!neuron?.modFollowees) return [];
    return Object.entries(neuron.modFollowees)
      .filter(([, topics]) => (topics as number[]).includes(followTopic))
      .map(([id]) => id);
  }, [neuron, followTopic]);

  const [followees, setFollowees] = useState<string[]>(initialFollowees);
  const [inputNeuronId, setInputNeuronId] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const topicName = KNOWN_TOPICS[followTopic] || `Topic ${followTopic}`;

  const { transaction, setTransaction, status, bridgePending, bridgeError } = useBridgeTransaction(
    () => {
      const tx = bridge.createTransaction(mainAccount);
      return {
        account,
        transaction: bridge.updateTransaction(tx, {
          type: "follow",
          neuronId,
          followTopic,
          followeesIds: followees,
        }),
      };
    },
  );

  invariant(transaction, "transaction must be defined");

  // Update transaction when followees change
  const updateFollowees = useCallback(
    (newFollowees: string[]) => {
      setFollowees(newFollowees);
      setTransaction(
        bridge.updateTransaction(transaction, {
          followeesIds: newFollowees,
        }),
      );
    },
    [bridge, setTransaction, transaction],
  );

  const onChangeInputNeuronId = useCallback(
    (value: string) => {
      setInputNeuronId(value);
      if (value && /[^0-9]/.test(value)) {
        setInputError(t("icp.neuronManage.followSelectFollowees.invalidNeuronId"));
      } else if (followees.includes(value)) {
        setInputError(t("icp.neuronManage.followSelectFollowees.alreadyAdded"));
      } else {
        setInputError(null);
      }
    },
    [followees, t],
  );

  const onAddFollowee = useCallback(
    (id?: string) => {
      const newId = id || inputNeuronId;
      if (!newId || followees.includes(newId)) return;
      if (id === undefined && inputError) return;

      updateFollowees([...followees, newId]);
      if (!id) setInputNeuronId("");
    },
    [inputNeuronId, inputError, followees, updateFollowees],
  );

  const onRemoveFollowee = useCallback(
    (id: string) => {
      updateFollowees(followees.filter(f => f !== id));
    },
    [followees, updateFollowees],
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

  const error = bridgePending ? null : getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");
  const hasErrors = hasStatusError(status);

  const isDisabled = useMemo(() => {
    if (bridgePending || !!bridgeError || hasErrors) return true;
    if (followees.length === 0) return true;
    return false;
  }, [bridgePending, bridgeError, hasErrors, followees.length]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ICP Neuron Management"
        name="FollowSelectFollowees"
        flow="manage"
        action="follow"
        currency="internet_computer"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="h4" fontWeight="semiBold" mb={2}>
            {topicName}
          </Text>
          <Text variant="body" color="neutral.c70">
            <Trans i18nKey="icp.neuronManage.followSelectFollowees.description" />
          </Text>
        </View>

        {/* Custom Neuron ID Input */}
        <View style={styles.inputSection}>
          <Text variant="body" fontWeight="semiBold" mb={2}>
            <Trans i18nKey="icp.neuronManage.followSelectFollowees.addNeuronId" />
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: inputError ? colors.notification : colors.border,
                  color: colors.text,
                },
              ]}
              value={inputNeuronId}
              onChangeText={onChangeInputNeuronId}
              placeholder={t("icp.neuronManage.followSelectFollowees.placeholder")}
              placeholderTextColor={colors.border}
              keyboardType="numeric"
            />
            <Button
              type="main"
              size="small"
              onPress={() => onAddFollowee()}
              disabled={!inputNeuronId || !!inputError}
              ml={2}
            >
              <Trans i18nKey="common.add" />
            </Button>
          </View>
          {inputError && (
            <Text variant="small" color="error.c50" mt={1}>
              {inputError}
            </Text>
          )}
        </View>

        {/* Known Neuron IDs */}
        <View style={styles.knownSection}>
          <Text variant="body" fontWeight="semiBold" mb={2}>
            <Trans i18nKey="icp.neuronManage.followSelectFollowees.knownNeurons" />
          </Text>
          {neuronIdsList.map(([id, name]) => (
            <View key={id} style={[styles.knownNeuronRow, { borderColor: colors.border }]}>
              <View style={styles.knownNeuronInfo}>
                <Text variant="body" fontWeight="semiBold">
                  {name}
                </Text>
                <Text variant="small" color="neutral.c70" numberOfLines={1}>
                  ID: {id}
                </Text>
              </View>
              <Button
                type="shade"
                size="small"
                onPress={() => onAddFollowee(id)}
                disabled={followees.includes(id)}
              >
                <Trans i18nKey="common.add" />
              </Button>
            </View>
          ))}
        </View>

        {/* Selected Followees List - Always show section */}
        <View style={styles.followeesSection}>
          <Text variant="body" fontWeight="semiBold" mb={2}>
            <Trans
              i18nKey="icp.neuronManage.followSelectFollowees.selectedFollowees"
              values={{ count: followees.length }}
            />
          </Text>
          {followees.length === 0 ? (
            <View style={[styles.emptyFollowees, { borderColor: colors.border }]}>
              <Text variant="body" color="neutral.c70" textAlign="center">
                <Trans i18nKey="icp.neuronManage.followSelectFollowees.noFollowees" />
              </Text>
            </View>
          ) : (
            followees.map(id => (
              <View key={id} style={[styles.followeeRow, { borderColor: colors.border }]}>
                <View style={styles.followeeInfo}>
                  <Text variant="body" fontWeight="semiBold">
                    {KNOWN_NEURON_IDS[id] || id}
                  </Text>
                  {KNOWN_NEURON_IDS[id] && (
                    <Text variant="small" color="neutral.c70">
                      {id}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => onRemoveFollowee(id)}>
                  <Text color="error.c50">
                    <Trans i18nKey="common.remove" />
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ActionFooter
        error={error}
        warning={warning}
        onContinue={onContinue}
        isDisabled={isDisabled}
        isPending={bridgePending}
        testID="icp-neuron-follow-continue"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  knownSection: {
    marginBottom: 24,
  },
  knownNeuronRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  knownNeuronInfo: {
    flex: 1,
    marginRight: 12,
  },
  followeesSection: {
    marginBottom: 24,
  },
  followeeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  followeeInfo: {
    flex: 1,
    marginRight: 12,
  },
  emptyFollowees: {
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    padding: 16,
  },
});
