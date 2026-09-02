import { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import { isDeviceControlledNeuron } from "@ledgerhq/live-common/families/internet_computer/neuron";
import { useICPPrincipal } from "@ledgerhq/live-common/families/internet_computer/react";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import MissingNeuron from "./MissingNeuron";
import { useGovernanceTopicLabel } from "../../useGovernanceTopicLabel";
import type { FollowTopic, StepProps } from "../../neuronFlow/types";

// "Unspecified" is the catch-all default the canister applies when no topic-specific followees are
// set; the others are the concrete governance topics a neuron can follow on.
const TOPICS = Object.keys(KNOWN_TOPICS) as FollowTopic[];

/** Picks the governance topic whose followees the next step edits. */
const StepFollowTopic = ({
  account,
  neurons,
  selectedNeuronId,
  setSelectedNeuronId,
  onUpdateTransaction,
  transitionTo,
}: StepProps) => {
  const principal = useICPPrincipal(account);
  const topicLabel = useGovernanceTopicLabel();
  const neuron = neurons.find(n => n.id?.toString() === selectedNeuronId);
  // Following is a voting action a hot key may take — except on NeuronManagement, which the
  // canister reserves for the controller (governance.rs, `follow`).
  const isControlled = !!neuron && isDeviceControlledNeuron(neuron, principal);

  const onSelect = useCallback(
    (topic: FollowTopic) => {
      // The transaction is the only place the chosen topic lives, so the topic the next step shows
      // and the one the device signs cannot drift apart. Changing topic re-seeds the list from that
      // topic's current followees — `follow` replaces the whole list, so an untouched submission has
      // to be a no-op rather than a wipe — while re-picking the same one keeps an edit in progress.
      onUpdateTransaction(tx =>
        tx.followTopic === topic
          ? tx
          : {
              ...tx,
              followTopic: topic,
              followeesIds: (
                neuron?.followees.find(f => f.topic === KNOWN_TOPICS[topic])?.followeeIds ?? []
              ).map(id => id.toString()),
            },
      );
      transitionTo("selectFollowees");
    },
    [neuron, onUpdateTransaction, transitionTo],
  );

  if (!neuron) {
    return <MissingNeuron setSelectedNeuronId={setSelectedNeuronId} transitionTo={transitionTo} />;
  }

  return (
    <Box px={4}>
      <Text ff="Inter|Regular" fontSize={4} color="neutral.c70" mb={3}>
        <Trans i18nKey="internetComputer.manageNeuronFlow.followTopic.description" />
      </Text>
      {/* All 19 governance topics are shown, so the list scrolls within itself rather than pushing
          the footer off-screen and making the whole modal scroll. Same shape as aleo's record
          picker, the nearest fixed-enumeration precedent. */}
      <Box flow={2} style={{ maxHeight: 320, overflowY: "auto" }}>
        {TOPICS.map(topic => {
          const followees = neuron?.followees.find(f => f.topic === KNOWN_TOPICS[topic]);
          const controllerOnly = topic === "NeuronManagement" && !isControlled;
          return (
            <Button
              key={topic}
              outline
              disabled={controllerOnly}
              onClick={() => onSelect(topic)}
              data-testid={`icp-follow-topic-${topic}`}
            >
              <Box horizontal justifyContent="space-between" width="100%" alignItems="center">
                <Text ff="Inter|SemiBold" fontSize={4}>
                  {topicLabel(topic)}
                </Text>
                <Text ff="Inter|Regular" fontSize={3} color="neutral.c70">
                  <Trans
                    i18nKey="internetComputer.manageNeuronFlow.followTopic.followeeCount"
                    count={followees?.followeeIds.length ?? 0}
                  />
                </Text>
              </Box>
            </Button>
          );
        })}
      </Box>
    </Box>
  );
};

export default StepFollowTopic;
