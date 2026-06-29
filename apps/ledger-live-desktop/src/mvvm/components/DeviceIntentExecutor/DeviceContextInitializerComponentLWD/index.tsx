import React from "react";
import type {
  DeviceConnectionResult,
  DeviceContextInitializerComponent,
  DeviceExtractedContext,
} from "@ledgerhq/device-intent";
import type { EnsureAppReadyUseCaseDependencies } from "@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { InitializationInput } from "../types";

export type InitializerConfig =
  | {
      dependencies?: Partial<EnsureAppReadyUseCaseDependencies>;
    }
  | undefined;

function formatParams(params: unknown): string {
  return JSON.stringify(params, null, 2) ?? "";
}

const DeviceContextInitializerComponentLWD: DeviceContextInitializerComponent<
  InitializationInput,
  InitializerConfig
> = ({ connectionResult, deviceInitializationInput, onContextInitialized, onClose }) => {
  const simulateInitialized = () => {
    onContextInitialized(buildMockDeviceContext(deviceInitializationInput));
  };

  return (
    <div
      className="flex w-full flex-col gap-24 px-16 py-24"
      data-testid="device-intent-executor-device-context-initializer-placeholder"
    >
      <div className="flex flex-col gap-8 text-center">
        <h3 className="heading-4-semi-bold text-base">Device context initializer placeholder</h3>
        <p className="body-2 text-muted">
          The desktop device initializer implementation is pending.
        </p>
      </div>
      <DebugSection title="Connected device" value={buildConnectionSummary(connectionResult)} />
      <DebugSection title="Initialization input" value={deviceInitializationInput} />
      <div className="flex w-full flex-col gap-12">
        <Button appearance="base" size="lg" isFull onClick={simulateInitialized}>
          Simulate initialized context
        </Button>
        <Button appearance="gray" size="lg" isFull onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

function DebugSection({ title, value }: Readonly<{ title: string; value: unknown }>) {
  return (
    <div className="flex flex-col gap-8">
      <span className="body-2-semi-bold text-base">{title}</span>
      <pre className="max-h-[240px] overflow-auto rounded-md bg-muted p-12 text-left font-mono text-xs text-base">
        {formatParams(value)}
      </pre>
    </div>
  );
}

function buildConnectionSummary(connectionResult: DeviceConnectionResult) {
  return {
    sessionId: connectionResult.sessionId,
    compatDeviceId: connectionResult.compatDeviceId,
    compatDeviceModelId: connectionResult.compatDeviceModelId,
    compatDeviceName: connectionResult.compatDeviceName,
    compatDeviceWired: connectionResult.compatDeviceWired,
    connectedDevice: {
      id: connectionResult.connectedDevice.id,
      name: connectionResult.connectedDevice.name,
      modelId: connectionResult.connectedDevice.modelId,
      sessionId: connectionResult.connectedDevice.sessionId,
      type: connectionResult.connectedDevice.type,
      transport: connectionResult.connectedDevice.transport,
    },
  };
}

function buildMockDeviceContext(
  deviceInitializationInput: InitializationInput,
): DeviceExtractedContext {
  return {
    currentOsVersion: "2.2.0",
    osUpdateAvailable: false,
    currentAppName: deviceInitializationInput.appName,
    currentAppVersion: "1.0.0-debug",
    derivedAddress: deviceInitializationInput.requiresDerivation
      ? "0x0000000000000000000000000000000000000000"
      : undefined,
  };
}

export default DeviceContextInitializerComponentLWD;
