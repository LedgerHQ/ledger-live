import React from "react";
import { Text, Flex } from "@ledgerhq/native-ui";
import type {
  GetEthAddressDMKSignerDemoIntentExtraProps,
  GetEthAddressDMKSignerDemoIntentJobState,
} from "./types";

export function GetEthAddressDMKSignerDemoIntentComponentLWM({
  jobState,
}: {
  jobState: GetEthAddressDMKSignerDemoIntentJobState | undefined;
  extraProps: GetEthAddressDMKSignerDemoIntentExtraProps;
  onClose: () => void;
}) {
  return (
    <Flex p={4}>
      {jobState?.type === "deriving" ? (
        <>
          <Text variant="h5" mb={4}>
            Deriving ETH address (DMK Signer)…
          </Text>
          <Text variant="small" color="neutral.c70" mb={2}>
            Status: {jobState.daStatus}
          </Text>
          {jobState.userInteraction && (
            <Text variant="small" color="neutral.c70" mb={1}>
              User interaction: {jobState.userInteraction}
            </Text>
          )}
        </>
      ) : jobState?.type === "derived" ? (
        <>
          <Text variant="body" color="success.c60" mb={2}>
            ETH address derived (DMK Signer)
          </Text>
          <Text variant="small" fontFamily="monospace" color="neutral.c70" numberOfLines={2}>
            {jobState.address}
          </Text>
        </>
      ) : jobState?.type === "failed" ? (
        <Text variant="body" color="error.c60">
          Failed (DMK Signer):{" "}
          {jobState.error instanceof Error ? jobState.error.message : String(jobState.error)}
        </Text>
      ) : null}
    </Flex>
  );
}
