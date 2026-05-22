import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import type { SignApprovalEvmIntentExtraProps, SignApprovalEvmJobState } from "./types";

const STATUS_LABEL: Record<SignApprovalEvmJobState["type"], string> = {
  preparing: "Preparing approval transaction…",
  "loading-context": "Loading signing context on device…",
  "awaiting-confirmation": "Confirm the approval on your device",
  signing: "Signing approval on device…",
  signed: "Approval signed",
  failed: "Approval signing failed",
};

export function SignApprovalEvmIntentComponentLWM({
  jobState,
}: {
  jobState: SignApprovalEvmJobState | undefined;
  extraProps: SignApprovalEvmIntentExtraProps;
  onClose: () => void;
}) {
  const status = jobState ? STATUS_LABEL[jobState.type] : STATUS_LABEL.preparing;
  return (
    <Flex p={4}>
      <Text variant="h5" mb={3}>
        Token approval
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
