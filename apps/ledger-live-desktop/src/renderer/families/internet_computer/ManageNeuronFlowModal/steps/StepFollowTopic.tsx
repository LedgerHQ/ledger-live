import { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import type { FollowTopic, StepProps } from "../../neuronFlow/types";

// "Unspecified" is the catch-all default the canister applies when no topic-specific followees are
// set; the others are the concrete governance topics a neuron can follow on.
const TOPICS = Object.keys(KNOWN_TOPICS) as FollowTopic[];

/** Picks the governance topic whose followees the next step edits. */
const StepFollowTopic = ({
  neurons,
  selectedNeuronId,
  setFollowTopic,
  transitionTo,
}: StepProps) => {
  const neuron = neurons.find(n => n.id?.toString() === selectedNeuronId);

  const onSelect = useCallback(
    (topic: FollowTopic) => {
      setFollowTopic(topic);
      transitionTo("selectFollowees");
    },
    [setFollowTopic, transitionTo],
  );

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
          return (
            <Button
              key={topic}
              outline
              onClick={() => onSelect(topic)}
              data-testid={`icp-follow-topic-${topic}`}
            >
              <Box horizontal justifyContent="space-between" width="100%" alignItems="center">
                <Text ff="Inter|SemiBold" fontSize={4}>
                  {topic}
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
