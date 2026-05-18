import React from "react";
import { Text, Flex } from "@ledgerhq/native-ui";
import type { TimerDemoIntentExtraProps, TimerDemoIntentJobState } from "./types";

export function TimerDemoIntentComponentLWM({
  jobState,
}: {
  jobState: TimerDemoIntentJobState | undefined;
  extraProps: TimerDemoIntentExtraProps;
  onClose: () => void;
}) {
  return (
    <Flex p={4}>
      <Text variant="body">
        Timer intent —{" "}
        {jobState?.type === "tick" ? `tick ${jobState.count}/${jobState.total}` : "starting…"}
      </Text>
    </Flex>
  );
}
