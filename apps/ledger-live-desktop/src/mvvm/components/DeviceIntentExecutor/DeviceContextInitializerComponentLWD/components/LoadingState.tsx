import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import type { InitializerDevice } from "../types";
import { LoadingContent } from "../../components/DeviceGenericStates/LoadingContent";

type LoadingStateProps = Readonly<{
  device: InitializerDevice;
}>;

const LOADING_PAGE_EVENT_DWELL_MS = 250;

export function LoadingState({ device }: LoadingStateProps) {
  const { t } = useTranslation();
  const [dwellElapsed, setDwellElapsed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDwellElapsed(true), LOADING_PAGE_EVENT_DWELL_MS);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      {dwellElapsed && (
        <TrackDIEScreen
          category={PAGE_CONNECT_APP.Loading}
          modelId={device.modelId}
          refreshSource
        />
      )}
      <LoadingContent
        title={t("deviceIntentExecutor.initialization.loading.title")}
        testID="device-initializer-loading"
      />
    </>
  );
}
