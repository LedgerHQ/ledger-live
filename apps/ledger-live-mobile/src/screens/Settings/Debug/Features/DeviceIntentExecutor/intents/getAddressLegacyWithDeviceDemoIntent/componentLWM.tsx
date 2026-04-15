import React from "react";
import { Text, Flex } from "@ledgerhq/native-ui";
import type {
  GetAddressLegacyWithDeviceDemoIntentExtraProps,
  GetAddressLegacyWithDeviceDemoIntentJobState,
} from "./types";

export function GetAddressLegacyWithDeviceDemoIntentComponentLWM({
  jobState,
}: {
  jobState: GetAddressLegacyWithDeviceDemoIntentJobState | undefined;
  extraProps: GetAddressLegacyWithDeviceDemoIntentExtraProps;
}) {
  return (
    <Flex p={4}>
      {jobState?.type === "gotTransport" ? (
        <Text variant="h5">Got transport (legacy withDevice)</Text>
      ) : jobState?.type === "deriving" ? (
        <Text variant="h5">Deriving address (legacy withDevice)…</Text>
      ) : jobState?.type === "completed" ? (
        <>
          <Text variant="body" color="success.c60" mb={2}>
            Address derived (legacy withDevice)
          </Text>
          <Text variant="small" fontFamily="monospace" color="neutral.c70" numberOfLines={2}>
            {jobState.address}
          </Text>
        </>
      ) : jobState?.type === "failed" ? (
        <Text variant="body" color="error.c60">
          Failed (legacy withDevice):{" "}
          {jobState.error instanceof Error ? jobState.error.message : String(jobState.error)}
        </Text>
      ) : null}
    </Flex>
  );
}
