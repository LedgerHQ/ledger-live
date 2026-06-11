import React from "react";
import { BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import { Text, Flex } from "@ledgerhq/native-ui";
import { OverrideDeviceIntentExecutorHeader } from "LLM/components/DeviceIntentExecutor";
import type { TimerDemoIntentExtraProps, TimerDemoIntentJobState } from "./types";

export function TimerDemoIntentComponentLWM({
  jobState,
}: {
  jobState: TimerDemoIntentJobState | undefined;
  extraProps: TimerDemoIntentExtraProps;
  onClose: () => void;
}) {
  return (
    <>
      <OverrideDeviceIntentExecutorHeader>
        <BottomSheetHeader title="Timer intent" density="compact" />
      </OverrideDeviceIntentExecutorHeader>
      <Flex p={4}>
        <Text variant="body">
          Timer intent —{" "}
          {jobState?.type === "tick" ? `tick ${jobState.count}/${jobState.total}` : "starting…"}
        </Text>
      </Flex>
    </>
  );
}
