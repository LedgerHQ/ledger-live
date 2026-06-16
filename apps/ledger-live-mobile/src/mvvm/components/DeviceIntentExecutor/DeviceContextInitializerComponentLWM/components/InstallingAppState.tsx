import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Trans } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import ModalLock from "~/components/ModalLock";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import type { InitializerDevice } from "../types";
import type { SourceFlow } from "../../utils/SourceFlowContext";
import { LoadingContent } from "./LoadingContent";
import { OverrideDeviceIntentExecutorHeader } from "../../components/OverrideDeviceIntentExecutorHeader";

type InstallingAppStateProps = Readonly<{
  device: InitializerDevice;
  sourceFlow: SourceFlow;
}>;

export function InstallingAppState({ device, sourceFlow }: InstallingAppStateProps) {
  return (
    <>
      <ModalLock />
      <OverrideDeviceIntentExecutorHeader>
        <Box lx={{ height: "s64" }} />
      </OverrideDeviceIntentExecutorHeader>
      <TrackScreen
        category={PAGE_CONNECT_APP.InstallingApp}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        refreshSource
        deviceUxV2
      />
      <LoadingContent
        title={<Trans i18nKey="deviceIntentExecutor.initialization.installingApp.title" />}
        testID="device-initializer-installing-app"
      />
    </>
  );
}
