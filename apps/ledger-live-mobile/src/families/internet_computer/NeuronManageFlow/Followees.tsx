import { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import { BaseInput, Button, Flex, ScrollContainer, Text } from "@ledgerhq/native-ui";
import React, { useCallback, useMemo, useState } from "react";
import { TrackScreen } from "~/analytics";
import KeyboardView from "~/components/KeyboardView";
import SafeAreaView from "~/components/SafeAreaView";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import ActionFooter from "../components/ActionFooter";
import { NeuronDetailRow } from "../components/NeuronDetails";
import { useGovernanceTopicLabel } from "../useGovernanceTopicLabel";
import { useNeuronAction } from "./useNeuronAction";
import MissingNeuron from "./MissingNeuron";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerNeuronManageFlowParamList,
  ScreenName.InternetComputerNeuronFollowees
>;

const EMPTY_FOLLOWEES: string[] = [];

/**
 * Edits the followee list for one topic. The canister replaces the whole list per `follow` call, so
 * removing a followee means submitting the remaining ones — there is no per-followee delete call.
 *
 * Both the topic and the list are read straight off the transaction, which FollowTopic seeds:
 * anything this screen held separately could disagree with what the device is handed.
 */
export default function Followees({ navigation, route }: Props) {
  const { t } = useTranslation();
  const topicLabel = useGovernanceTopicLabel();
  const [draft, setDraft] = useState("");
  const {
    neuron,
    backToList,
    transaction,
    updateTransaction,
    status,
    bridgePending,
    continueToDevice,
  } = useNeuronAction(navigation, route);
  const followTopic = transaction?.followTopic;
  const topicName = followTopic ? topicLabel(followTopic) : "";
  // How many followees the neuron currently has on the topic being edited.
  const currentCount = followTopic
    ? (neuron?.followees.find(f => f.topic === KNOWN_TOPICS[followTopic])?.followeeIds.length ?? 0)
    : 0;

  // Stable across renders: the `?? []` fallback would otherwise be a fresh array every time, which
  // invalidates every callback below.
  const followeesIds = useMemo(
    () => transaction?.followeesIds ?? EMPTY_FOLLOWEES,
    [transaction?.followeesIds],
  );

  const setFollowees = useCallback(
    (next: string[]) => updateTransaction(tx => ({ ...tx, followeesIds: next })),
    [updateTransaction],
  );

  const onAdd = useCallback(() => {
    const id = draft.replace(/\D/g, "");
    if (!id || followeesIds.includes(id)) return;
    setFollowees([...followeesIds, id]);
    setDraft("");
  }, [draft, followeesIds, setFollowees]);

  if (!neuron) return <MissingNeuron onBackToList={backToList} />;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen
        category="Manage Neurons ICP Flow"
        name="Followees"
        flow="stake"
        action="follow"
      />
      <KeyboardView style={{ flex: 1 }}>
        <ScrollContainer contentContainerStyle={{ padding: 16 }}>
          <Text variant="body" color="neutral.c70" mb={5}>
            {t("internetComputer.manageNeuronFlow.selectFollowees.description", {
              topic: topicName,
            })}
          </Text>
          <Text variant="small" fontWeight="semiBold" color="neutral.c70" mb={2}>
            {t("internetComputer.manageNeuronFlow.selectFollowees.neuronId")}
          </Text>
          <Flex flexDirection="row" alignItems="center" mb={5} style={{ gap: 8 }}>
            <Flex flex={1}>
              <BaseInput
                value={draft}
                onChange={setDraft}
                keyboardType="number-pad"
                testID="icp-followee-input"
              />
            </Flex>
            <Button
              type="main"
              size="small"
              onPress={onAdd}
              disabled={!draft}
              testID="icp-followee-add-button"
            >
              {t("internetComputer.manageNeuronFlow.selectFollowees.add")}
            </Button>
          </Flex>
          {followeesIds.length === 0 ? (
            /* The canister replaces the whole list per call, so submitting an empty one is how a
               topic is cleared. That is a legitimate action but a destructive one, and the neutral
               empty-state copy read like a no-op. */
            <Text variant="small" color={currentCount > 0 ? "warning.c70" : "neutral.c70"}>
              {currentCount > 0
                ? t("internetComputer.manageNeuronFlow.selectFollowees.clearsFollowing", {
                    topic: topicName,
                    count: currentCount,
                  })
                : t("internetComputer.manageNeuronFlow.selectFollowees.empty")}
            </Text>
          ) : (
            followeesIds.map(id => (
              <NeuronDetailRow
                key={id}
                label={id}
                actions={[
                  {
                    label: t("internetComputer.manageNeuronFlow.selectFollowees.remove"),
                    onPress: () => setFollowees(followeesIds.filter(other => other !== id)),
                  },
                ]}
              />
            ))
          )}
        </ScrollContainer>
      </KeyboardView>
      <ActionFooter
        status={status}
        bridgePending={bridgePending}
        onContinue={continueToDevice}
        // Submitting an empty list clears the topic, which is worth allowing but not worth signing
        // for when there is nothing to clear: empty over empty changes nothing.
        canContinue={!!followTopic && (followeesIds.length > 0 || currentCount > 0)}
      />
    </SafeAreaView>
  );
}
