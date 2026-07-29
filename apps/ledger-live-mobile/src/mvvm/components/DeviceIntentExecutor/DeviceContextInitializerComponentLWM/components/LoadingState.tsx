import React, { useEffect, useState } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Trans } from "~/context/Locale";
import ModalLock from "~/components/ModalLock";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import type { InitializerDevice } from "../types";
import { LoadingContent } from "./LoadingContent";
import { OverrideDeviceIntentExecutorHeader } from "../../components/OverrideDeviceIntentExecutorHeader";

type LoadingStateProps = Readonly<{
  device: InitializerDevice;
}>;

/**
 * Gate the page event behind a short dwell so transient loading flashes
 * (state resolves in < 250ms) don't emit a `Connect App - Loading` event.
 */
const LOADING_PAGE_EVENT_DWELL_MS = 250;

export function LoadingState({ device }: LoadingStateProps) {
  const [dwellElapsed, setDwellElapsed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDwellElapsed(true), LOADING_PAGE_EVENT_DWELL_MS);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <ModalLock />
      <OverrideDeviceIntentExecutorHeader>
        <Box lx={{ height: "s64" }} />
      </OverrideDeviceIntentExecutorHeader>
      {dwellElapsed && (
        <TrackDIEScreen
          category={PAGE_CONNECT_APP.Loading}
          modelId={device.modelId}
          refreshSource
        />
      )}
      <LoadingContent
        title={<Trans i18nKey="deviceIntentExecutor.initialization.loading.title" />}
        testID="device-initializer-loading"
      />
    </>
  );
}
