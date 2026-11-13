import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { OverrideDeviceIntentExecutorHeader } from "@ledgerhq/live-dmk-shared";
import { rnBleTransportIdentifier, rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { OpenMyLedgerIntentJobState } from "@ledgerhq/live-common/intents/openMyLedgerIntent";
import { InfoState } from "@shared/ui-info-state";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { LoadingContent } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";
import { RetryableDeviceLocked } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/RetryableDeviceLocked";
import { UnlockDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/UnlockDevice";
import { DeviceNotOnboardedView } from "LLM/components/DeviceIntentExecutor/ContextInitializer/components/DeviceNotOnboarded/DeviceNotOnboardedView";
import { useDeviceNotOnboardedViewModel } from "LLM/components/DeviceIntentExecutor/ContextInitializer/components/DeviceNotOnboarded/useDeviceNotOnboardedViewModel";
import { BootloaderDiscovered } from "LLM/features/OsUpdate/components/BootloaderDiscovered";
import { CounterfeitDeviceError } from "~/components/DeviceAction/rendering";
import ModalLock from "~/components/ModalLock";
import { Trans, useTranslation } from "~/context/Locale";

type OpenMyLedgerIntentComponentProps = Readonly<{
  jobState: OpenMyLedgerIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function OpenMyLedgerIntentComponent({ jobState }: OpenMyLedgerIntentComponentProps) {
  const { t } = useTranslation();

  if (!jobState) {
    return null;
  }

  const { device } = jobState;
  const productName = getDeviceModel(device.modelId).productName;
  const deviceName = device.deviceName ?? productName;

  switch (jobState.type) {
    case "loading":
    case "loaded":
      return (
        <LoadingContent
          title={<Trans i18nKey="deviceIntentExecutor.initialization.loading.title" />}
          testID="open-my-ledger-loading"
        />
      );
    case "unresponsive":
      return (
        <UnlockDevice
          deviceModelId={device.modelId}
          deviceName={deviceName}
          testID="open-my-ledger-unresponsive"
        />
      );
    case "allow-secure-connection":
      return (
        <>
          <ModalLock />
          <OverrideDeviceIntentExecutorHeader>
            <Box lx={{ height: "s64" }} />
          </OverrideDeviceIntentExecutorHeader>
          <ContinueOnDevice
            deviceModelId={device.modelId}
            deviceName={deviceName}
            testID="open-my-ledger-allow-secure-connection"
          />
        </>
      );
    case "device-locked":
      return (
        <RetryableDeviceLocked
          deviceModelId={device.modelId}
          onRetry={jobState.retry}
          testID="open-my-ledger-device-locked"
        />
      );
    case "quit-app":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("DeviceAction.quitApp")}
          primaryCta={{
            label: t("common.retry"),
            onPress: jobState.retry,
            testID: "open-my-ledger-quit-app-retry",
          }}
          testID="open-my-ledger-quit-app"
        />
      );
    case "not-onboarded":
      return <NotOnboardedState device={device} productName={productName} />;
    case "bootloader":
      return (
        <BootloaderDiscovered
          device={{
            id: device.deviceId,
            name: device.deviceName ?? null,
            deviceModelId: device.modelId,
            transport: device.wired ? rnHidTransportIdentifier : rnBleTransportIdentifier,
          }}
        />
      );
    case "counterfeit":
      return <CounterfeitDeviceError device={device} />;
    default:
      return assertNever(jobState);
  }
}

function NotOnboardedState({
  device,
  productName,
}: Readonly<{ device: Device; productName: string }>) {
  const viewModel = useDeviceNotOnboardedViewModel({
    device: {
      id: device.deviceId,
      modelId: device.modelId,
      name: device.deviceName ?? productName,
      productName,
      wired: device.wired,
    },
  });
  return <DeviceNotOnboardedView {...viewModel} />;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled open My Ledger intent state: ${JSON.stringify(value)}`);
}
