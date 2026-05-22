import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import type { BroadcastEvmIntentExtraProps, BroadcastEvmJobState } from "./types";

function describe(jobState: BroadcastEvmJobState | undefined): string {
  if (!jobState) return "Preparing broadcast…";
  switch (jobState.type) {
    case "broadcasting":
      return "Broadcasting transaction to the network…";
    case "broadcasted":
      return `Transaction broadcasted (${jobState.hash.slice(0, 10)}…)`;
    case "waiting-receipt":
      return `Waiting for confirmation… (attempt ${jobState.pollCount})`;
    case "confirmed":
      return `Transaction confirmed in block ${jobState.blockHeight}`;
    case "failed":
      return "Broadcast failed";
  }
}

export function BroadcastEvmIntentComponentLWM({
  jobState,
}: {
  jobState: BroadcastEvmJobState | undefined;
  extraProps: BroadcastEvmIntentExtraProps;
  onClose: () => void;
}) {
  return (
    <Flex p={4}>
      <Text variant="h5" mb={3}>
        Broadcast
      </Text>
      <Text variant="body" mb={2}>
        {describe(jobState)}
      </Text>
      {jobState?.type === "failed" && (
        <Text variant="small" color="error.c60" numberOfLines={3}>
          {jobState.error.message}
        </Text>
      )}
      {(jobState?.type === "broadcasted" ||
        jobState?.type === "waiting-receipt" ||
        jobState?.type === "confirmed") && (
        <Text variant="small" fontFamily="monospace" color="neutral.c70" numberOfLines={2}>
          {jobState.hash}
        </Text>
      )}
    </Flex>
  );
}
