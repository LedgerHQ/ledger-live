import {
  KNOWN_TOPICS,
  MAX_FOLLOWEES_PER_TOPIC,
} from "@ledgerhq/live-common/families/internet_computer/consts";
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

type DraftIssue = "notANeuronId" | "outOfRange" | "duplicate" | "self" | "unadded";

// A followee id is a nat64. Bounding it here rather than letting Candid refuse it keeps the fault on
// the form: encoding happens inside signOperation, which would surface a developer string instead.
const MAX_NEURON_ID = 2n ** 64n - 1n;

/**
 * Reads the entry, reporting what is wrong with it and the id to add when nothing is.
 *
 * The entry is submitted as written, so it is validated rather than repaired: stripping non-digits
 * read `12a3` as neuron 123 and would delegate this neuron's voting power to a target the user never
 * typed. `follow` checks only the cap and that the topic exists, so nothing else catches any of it.
 */
const readDraft = (
  draft: string,
  followeesIds: readonly string[],
  neuronId: string | undefined,
): { issue?: DraftIssue; id?: string } => {
  const entry = draft.trim();
  if (!entry) return {};
  if (!/^\d+$/.test(entry)) return { issue: "notANeuronId" };
  const value = BigInt(entry);
  if (value === 0n || value > MAX_NEURON_ID) return { issue: "outOfRange" };
  // Canonical, which is not the repair refused above: `0123` and `123` are the same neuron, so
  // comparing the entry as typed let a leading zero past both checks below and submitted it twice.
  const id = value.toString();
  if (followeesIds.includes(id)) return { issue: "duplicate", id };
  // The canister accepts a neuron following itself; it just gains nothing by it, since a neuron
  // never sees its own ballot as a followee's.
  if (id === neuronId) return { issue: "self", id };
  return { issue: "unadded", id };
};

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

  const { issue, id: draftId } = readDraft(draft, followeesIds, neuron?.id?.toString());
  const isFull = followeesIds.length >= MAX_FOLLOWEES_PER_TOPIC;
  const canAdd = !isFull && issue === "unadded";

  const onAdd = useCallback(() => {
    if (!canAdd || !draftId) return;
    setFollowees([...followeesIds, draftId]);
    setDraft("");
  }, [canAdd, draftId, followeesIds, setFollowees]);

  if (!neuron) return <MissingNeuron onBackToList={backToList} />;

  // A malformed entry is the fault worth reporting even at capacity: removing a followee would not
  // make it addable.
  const notice =
    issue === "notANeuronId" || issue === "outOfRange" ? issue : isFull ? "atCapacity" : issue;

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
          <Flex mb={5} style={{ gap: 8 }}>
            <Flex flexDirection="row" alignItems="center" style={{ gap: 8 }}>
              <Flex flex={1}>
                <BaseInput
                  value={draft}
                  onChange={setDraft}
                  keyboardType="number-pad"
                  placeholder="13194199462915819287"
                  testID="icp-followee-input"
                />
              </Flex>
              <Button
                type="main"
                size="small"
                onPress={onAdd}
                disabled={!canAdd}
                testID="icp-followee-add-button"
              >
                {t("internetComputer.manageNeuronFlow.selectFollowees.add")}
              </Button>
            </Flex>
            {notice ? (
              <Text
                variant="small"
                color={notice === "unadded" ? "warning.c70" : "error.c50"}
                testID="icp-followee-notice"
              >
                {t(`internetComputer.manageNeuronFlow.selectFollowees.${notice}`, {
                  max: MAX_FOLLOWEES_PER_TOPIC,
                })}
              </Text>
            ) : null}
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
        // for when there is nothing to clear: empty over empty changes nothing. Only an addable id
        // blocks: it is absent from the list `follow` submits, so signing would drop it silently,
        // while any other entry adds nothing and must not hold the submission the user already has.
        canContinue={
          !!followTopic && issue !== "unadded" && (followeesIds.length > 0 || currentCount > 0)
        }
      />
    </SafeAreaView>
  );
}
