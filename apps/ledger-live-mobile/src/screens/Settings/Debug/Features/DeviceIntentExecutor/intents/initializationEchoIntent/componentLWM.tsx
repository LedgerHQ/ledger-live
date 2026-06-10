import React from "react";
import { BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import { Text, Flex } from "@ledgerhq/native-ui";
import { OverrideDeviceIntentExecutorHeader } from "LLM/components/DeviceIntentExecutor";
import type { InitializationEchoIntentJobState } from "./types";

export function InitializationEchoIntentComponentLWM({
  jobState,
}: Readonly<{
  jobState: InitializationEchoIntentJobState | undefined;
  extraProps: Record<string, never>;
  onClose: () => void;
}>) {
  return (
    <>
      <OverrideDeviceIntentExecutorHeader>
        <BottomSheetHeader title="Initialization Echo" density="compact" />
      </OverrideDeviceIntentExecutorHeader>
      <Flex p={4}>
        {jobState?.type === "contextReceived" ? (
          <>
            <Text variant="small" color="neutral.c70" mb={2}>
              Device context received by the intent job:
            </Text>
            <Text variant="small" fontFamily="monospace" color="neutral.c70">
              {JSON.stringify(jobState.deviceExtractedContext, null, 2)}
            </Text>
          </>
        ) : (
          <Text variant="small" color="neutral.c70">
            Waiting for initialization to complete...
          </Text>
        )}
      </Flex>
    </>
  );
}
