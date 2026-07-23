import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Trans } from "~/context/Locale";
import ModalLock from "~/components/ModalLock";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import type { InitializerDevice } from "../types";
import { LoadingContent } from "./LoadingContent";
import { OverrideDeviceIntentExecutorHeader } from "../../components/OverrideDeviceIntentExecutorHeader";

type InstallingAppStateProps = Readonly<{
  device: InitializerDevice;
}>;

export function InstallingAppState({ device }: InstallingAppStateProps) {
  return (
    <>
      <ModalLock />
      <OverrideDeviceIntentExecutorHeader>
        <Box lx={{ height: "s64" }} />
      </OverrideDeviceIntentExecutorHeader>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.InstallingApp}
        modelId={device.modelId}
        refreshSource
      />
      <LoadingContent
        title={<Trans i18nKey="deviceIntentExecutor.initialization.installingApp.title" />}
        testID="device-initializer-installing-app"
      />
    </>
  );
}
