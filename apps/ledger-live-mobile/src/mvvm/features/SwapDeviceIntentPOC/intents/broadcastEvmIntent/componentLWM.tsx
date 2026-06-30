import React from "react";
import { InfoState } from "LLM/components/InfoState";
import type { BroadcastEvmIntentExtraProps, BroadcastEvmJobState } from "./types";

function describeLoader(jobState: BroadcastEvmJobState | undefined): {
  title: string;
  description: string;
} {
  if (!jobState) {
    return { title: "Broadcasting transaction", description: "Preparing broadcast\u2026" };
  }
  switch (jobState.type) {
    case "broadcasting":
      return {
        title: "Broadcasting transaction",
        description: "Broadcasting transaction to the network\u2026",
      };
    case "broadcasted":
    case "waiting-receipt":
      return {
        title: "Confirming transaction",
        description: "Waiting for confirmation\u2026",
      };
    case "confirmed":
      return {
        title: "Transaction confirmed",
        description: `Confirmed in block ${jobState.blockHeight}`,
      };
    case "failed":
      return {
        title: "Broadcast failed",
        description: jobState.error.message,
      };
  }
}

export function BroadcastEvmIntentComponentLWM({
  jobState,
}: {
  jobState: BroadcastEvmJobState | undefined;
  extraProps: BroadcastEvmIntentExtraProps;
  onClose: () => void;
}) {
  if (jobState?.type === "failed") {
    const { title, description } = describeLoader(jobState);
    return <InfoState preset="error" size="hug" title={title} description={description} />;
  }

  const { title, description } = describeLoader(jobState);
  return <InfoState preset="loader" size="hug" title={title} description={description} />;
}
