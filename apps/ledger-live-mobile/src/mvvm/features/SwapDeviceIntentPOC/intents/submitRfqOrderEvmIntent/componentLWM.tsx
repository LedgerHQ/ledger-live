import React from "react";
import { InfoState } from "LLM/components/InfoState";
import type {
  SubmitRfqOrderEvmIntentExtraProps,
  SubmitRfqOrderEvmJobState,
} from "./types";

function describeLoader(jobState: SubmitRfqOrderEvmJobState | undefined): {
  title: string;
  description: string;
} {
  if (!jobState) {
    return {
      title: "Submitting RFQ order",
      description: "Sending signed order to partner\u2026",
    };
  }
  switch (jobState.type) {
    case "submitting":
      return {
        title: "Submitting RFQ order",
        description: "Sending signed order to partner\u2026",
      };
    case "submitted":
      return {
        title: "Waiting for partner",
        description: "Order submitted. Waiting for partner to fill\u2026",
      };
    case "polling":
      return {
        title: "Waiting for partner",
        description: "Waiting for order to be filled on-chain\u2026",
      };
    case "confirmed":
      return {
        title:
          jobState.status === "finished"
            ? "Order filled"
            : "Order refunded",
        description:
          jobState.status === "finished"
            ? "Your RFQ order was filled on-chain."
            : "Your RFQ order was not filled and you have been refunded.",
      };
    case "failed":
      return {
        title: "RFQ submit failed",
        description: jobState.error.message,
      };
  }
}

export function SubmitRfqOrderEvmIntentComponentLWM({
  jobState,
}: {
  jobState: SubmitRfqOrderEvmJobState | undefined;
  extraProps: SubmitRfqOrderEvmIntentExtraProps;
  onClose: () => void;
}) {
  if (jobState?.type === "failed") {
    const { title, description } = describeLoader(jobState);
    return (
      <InfoState
        preset="error"
        size="hug"
        title={title}
        description={description}
      />
    );
  }

  const { title, description } = describeLoader(jobState);
  return (
    <InfoState
      preset="loader"
      size="hug"
      title={title}
      description={description}
    />
  );
}
