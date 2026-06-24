import React from "react";
import type { DeviceConnectionComponent, DeviceConnectionResult } from "@ledgerhq/device-intent";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Button } from "@ledgerhq/lumen-ui-react";
import { EMPTY } from "rxjs";

function formatParams(params: unknown): string {
  return JSON.stringify(params, null, 2) ?? "";
}

const DeviceConnectionComponentLWD: DeviceConnectionComponent = ({
  deviceConnectionParams,
  onConnected,
  onClose,
}) => {
  const simulateConnected = () => {
    onConnected(buildMockConnectionResult());
  };

  return (
    <div
      className="flex w-full flex-col gap-24 px-16 py-24"
      data-testid="device-intent-executor-device-connection-placeholder"
    >
      <div className="flex flex-col gap-8 text-center">
        <h3 className="heading-4-semi-bold text-base">Device connection placeholder</h3>
        <p className="body-2 text-muted">
          The desktop device connection implementation is pending.
        </p>
      </div>
      <pre className="max-h-[240px] overflow-auto rounded-md bg-muted p-12 text-left font-mono text-xs text-base">
        {formatParams(deviceConnectionParams)}
      </pre>
      <div className="flex w-full flex-col gap-12">
        <Button appearance="base" size="lg" isFull onClick={simulateConnected}>
          Simulate connected device
        </Button>
        <Button appearance="gray" size="lg" isFull onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

function buildMockConnectionResult(): DeviceConnectionResult {
  const sessionId = "debug-session-id";

  return {
    dmk: {
      getDeviceSessionState: () => EMPTY,
    } as unknown as DeviceConnectionResult["dmk"],
    sessionId,
    connectedDevice: {
      id: "debug-device-id",
      name: "Ledger Flex Debug",
      modelId: "FLEX",
      sessionId,
      type: "USB",
      transport: "web-hid",
    } as unknown as DeviceConnectionResult["connectedDevice"],
    compatDeviceId: "debug-device-id",
    compatDeviceModelId: DeviceModelId.europa,
    compatDeviceName: "Ledger Flex Debug",
    compatDeviceWired: true,
  };
}

export default DeviceConnectionComponentLWD;
