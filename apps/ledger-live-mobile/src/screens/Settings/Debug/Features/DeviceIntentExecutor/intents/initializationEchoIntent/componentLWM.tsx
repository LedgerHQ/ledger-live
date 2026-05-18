import React from "react";
import { Text, Flex } from "@ledgerhq/native-ui";
import type { InitializationEchoIntentJobState } from "./types";

export function InitializationEchoIntentComponentLWM({
  jobState,
}: Readonly<{
  jobState: InitializationEchoIntentJobState | undefined;
  extraProps: Record<string, never>;
  onClose: () => void;
}>) {
  return (
    <Flex p={4}>
      <Text variant="subtitle" mb={2}>
        Initialization Echo
      </Text>
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
  );
}
