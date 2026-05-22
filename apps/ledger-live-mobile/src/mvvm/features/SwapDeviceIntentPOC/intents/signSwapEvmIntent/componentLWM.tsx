import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import type { SignSwapEvmIntentExtraProps, SignSwapEvmJobState } from "./types";

const STATUS_LABEL: Record<SignSwapEvmJobState["type"], string> = {
  preparing: "Preparing swap transaction…",
  "loading-context": "Loading signing context on device…",
  "awaiting-confirmation": "Confirm the swap on your device",
  signing: "Signing swap on device…",
  signed: "Swap signed",
  failed: "Swap signing failed",
};

export function SignSwapEvmIntentComponentLWM({
  jobState,
}: {
  jobState: SignSwapEvmJobState | undefined;
  extraProps: SignSwapEvmIntentExtraProps;
  onClose: () => void;
}) {
  const status = jobState ? STATUS_LABEL[jobState.type] : STATUS_LABEL.preparing;
  return (
    <Flex p={4}>
      <Text variant="h5" mb={3}>
        Swap
      </Text>
      <Text variant="body" mb={2}>
        {status}
      </Text>
      {jobState?.type === "failed" && (
        <Text variant="small" color="error.c60" numberOfLines={3}>
          {jobState.error.message}
        </Text>
      )}
    </Flex>
  );
}
