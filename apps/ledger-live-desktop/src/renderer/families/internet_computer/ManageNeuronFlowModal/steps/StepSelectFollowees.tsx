import { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import React, { useCallback, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import Text from "~/renderer/components/Text";
import { NeuronDetailRow } from "../../components/NeuronDetails";
import SubmitFooter from "./SubmitFooter";
import MissingNeuron from "./MissingNeuron";
import type { StepProps } from "../../neuronFlow/types";

const EMPTY_FOLLOWEES: string[] = [];

/** How many followees the neuron currently has on the topic being edited. */
const currentFolloweeCount = ({ neurons, selectedNeuronId, transaction }: StepProps): number => {
  const followTopic = transaction?.followTopic;
  if (!followTopic) return 0;
  const neuron = neurons.find(n => n.id?.toString() === selectedNeuronId);
  return (
    neuron?.followees.find(f => f.topic === KNOWN_TOPICS[followTopic])?.followeeIds.length ?? 0
  );
};

/**
 * Edits the followee list for one topic. The canister replaces the whole list per `follow` call, so
 * removing a followee means submitting the remaining ones — there is no per-followee delete call.
 *
 * Both the topic and the list are read straight off the transaction, which StepFollowTopic seeds:
 * anything this step held separately could disagree with what the device is handed.
 */
const StepSelectFollowees = (props: StepProps) => {
  const {
    neurons,
    selectedNeuronId,
    setSelectedNeuronId,
    transaction,
    onUpdateTransaction,
    transitionTo,
  } = props;
  // Only its presence matters here: this step reads the followee count off the transaction, not the
  // neuron, so `some` says all that is needed.
  const hasNeuron = neurons.some(n => n.id?.toString() === selectedNeuronId);
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const followTopic = transaction?.followTopic;
  const currentCount = currentFolloweeCount(props);
  // Stable across renders: the `?? []` fallback would otherwise be a fresh array every time, which
  // invalidates every callback below.
  const followeesIds = useMemo(
    () => transaction?.followeesIds ?? EMPTY_FOLLOWEES,
    [transaction?.followeesIds],
  );

  const setFollowees = useCallback(
    (next: string[]) => onUpdateTransaction(tx => ({ ...tx, followeesIds: next })),
    [onUpdateTransaction],
  );

  const onAdd = useCallback(() => {
    const id = draft.replace(/\D/g, "");
    if (!id || followeesIds.includes(id)) return;
    setFollowees([...followeesIds, id]);
    setDraft("");
  }, [draft, followeesIds, setFollowees]);

  if (!hasNeuron) {
    return <MissingNeuron setSelectedNeuronId={setSelectedNeuronId} transitionTo={transitionTo} />;
  }

  if (!followTopic) return null;

  return (
    <Box flow={3} px={4}>
      <Text ff="Inter|Regular" fontSize={4} color="neutral.c70">
        <Trans
          i18nKey="internetComputer.manageNeuronFlow.selectFollowees.description"
          values={{ topic: followTopic }}
        />
      </Text>
      <Box horizontal style={{ gap: 8 }} alignItems="flex-end">
        <Box grow>
          <Text ff="Inter|SemiBold" fontSize={3} color="neutral.c70" mb={1}>
            <Trans i18nKey="internetComputer.manageNeuronFlow.selectFollowees.neuronId" />
          </Text>
          <Input value={draft} onChange={setDraft} data-testid="icp-followee-input" />
        </Box>
        <Button primary onClick={onAdd} disabled={!draft} data-testid="icp-followee-add-button">
          <Trans i18nKey="internetComputer.manageNeuronFlow.selectFollowees.add" />
        </Button>
      </Box>
      {followeesIds.length === 0 ? (
        <Text
          ff="Inter|Regular"
          fontSize={3}
          color={currentCount > 0 ? "warning.c70" : "neutral.c70"}
        >
          {/* The canister replaces the whole list per call, so submitting an empty one is how a topic
              is cleared. That is a legitimate action but a destructive one, and the neutral empty-state
              copy read like a no-op. */}
          <Trans
            i18nKey={
              currentCount > 0
                ? "internetComputer.manageNeuronFlow.selectFollowees.clearsFollowing"
                : "internetComputer.manageNeuronFlow.selectFollowees.empty"
            }
            values={{ topic: followTopic, count: currentCount }}
          />
        </Text>
      ) : (
        followeesIds.map(id => (
          <NeuronDetailRow
            key={id}
            label={id}
            actions={[
              {
                label: t("internetComputer.manageNeuronFlow.selectFollowees.remove"),
                onClick: () => setFollowees(followeesIds.filter(other => other !== id)),
              },
            ]}
          />
        ))
      )}
    </Box>
  );
};

// Submitting an empty list clears the topic, which is worth allowing but not worth signing for when
// there is nothing to clear: empty over empty is a device confirmation that changes nothing.
export const StepSelectFolloweesFooter = (props: StepProps) => {
  const submitted = props.transaction?.followeesIds?.length ?? 0;
  const canContinue =
    !!props.transaction?.followTopic && (submitted > 0 || currentFolloweeCount(props) > 0);

  return <SubmitFooter {...props} canContinue={canContinue} />;
};

export default StepSelectFollowees;
