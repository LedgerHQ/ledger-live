import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import type { SignPermit2EvmIntentExtraProps, SignPermit2EvmJobState } from "./types";

const STATUS_LABEL: Record<SignPermit2EvmJobState["type"], string> = {
  preparing: "Preparing permit signature\u2026",
  "loading-context": "Loading permit context on device\u2026",
  "awaiting-confirmation": "Confirm the permit on your device",
  signing: "Signing permit on device\u2026",
  signed: "Permit signed",
  failed: "Permit signing failed",
};

export function SignPermit2EvmIntentComponentLWM({
  jobState,
}: {
  jobState: SignPermit2EvmJobState | undefined;
  extraProps: SignPermit2EvmIntentExtraProps;
  onClose: () => void;
}) {
  const status = jobState ? STATUS_LABEL[jobState.type] : STATUS_LABEL.preparing;
  return (
    <Flex p={4}>
      <Text variant="h5" mb={3}>
        Permit signing
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
