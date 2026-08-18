import React from "react";
import { useTranslation } from "react-i18next";
import { OverrideDeviceIntentExecutorHeader } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import type { InitializerDevice } from "../types";
import { LoadingContent } from "../../components/DeviceGenericStates/LoadingContent";

type InstallingAppStateProps = Readonly<{
  device: InitializerDevice;
}>;

export function InstallingAppState({ device }: InstallingAppStateProps) {
  const { t } = useTranslation();

  return (
    <>
      <OverrideDeviceIntentExecutorHeader>
        <div className="h-48" aria-hidden />
      </OverrideDeviceIntentExecutorHeader>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.InstallingApp}
        modelId={device.modelId}
        refreshSource
      />
      <LoadingContent
        title={t("deviceIntentExecutor.initialization.installingApp.title")}
        testID="device-initializer-installing-app"
      />
    </>
  );
}
