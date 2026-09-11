import { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { FollowTopic } from "./neuronFlow/types";

// The picker works from the topic names, while a neuron's own followees arrive as the numbers the
// canister reports, so the lookup has to go both ways.
const TOPIC_BY_ID = new Map<number, FollowTopic>(
  Object.entries(KNOWN_TOPICS).map(([name, id]) => [id, name as FollowTopic]),
);

/**
 * Human-readable name for a governance topic, given either its name or the canister's number.
 *
 * `KNOWN_TOPICS` keys are wire identifiers — `IcOsVersionDeployment`, `Kyc`, `SnsAndCommunityFund` —
 * so every screen showing a topic goes through here instead of printing the key.
 */
export const useGovernanceTopicLabel = () => {
  const { t } = useTranslation();
  return useCallback(
    (topic: FollowTopic | number): string => {
      const name = typeof topic === "number" ? TOPIC_BY_ID.get(topic) : topic;
      // A topic added to the canister since this build still names itself, rather than going blank.
      return name ? t(`internetComputer.governanceTopic.${name}`) : String(topic);
    },
    [t],
  );
};
