import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { getProductName } from "LLM/utils/getProductName";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { PerpsDepositSignTerms } from "./PerpsDepositSignTerms";

export function PerpsDepositConfirmation({ device }: Readonly<{ device: Device }>) {
  return (
    <Box lx={{ alignItems: "center", padding: "s24", gap: "s24" }}>
      <ContinueOnDevice
        deviceModelId={device.modelId}
        deviceName={device.deviceName || getProductName(device.modelId)}
      />
      <PerpsDepositSignTerms />
    </Box>
  );
}
