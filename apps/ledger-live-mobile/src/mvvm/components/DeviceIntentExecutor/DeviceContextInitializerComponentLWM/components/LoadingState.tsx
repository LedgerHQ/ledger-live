import React, { useEffect, useState } from "react";
import { Trans } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import type { InitializerDevice } from "../types";
import type { SourceFlow } from "../../utils/SourceFlowContext";
import { LoadingContent } from "./LoadingContent";

type LoadingStateProps = Readonly<{
  device: InitializerDevice;
  sourceFlow: SourceFlow;
}>;

/**
 * Gate the page event behind a short dwell so transient loading flashes
 * (state resolves in < 250ms) don't emit a `Connect App - Loading` event.
 */
const LOADING_PAGE_EVENT_DWELL_MS = 250;

export function LoadingState({ device, sourceFlow }: LoadingStateProps) {
  const [dwellElapsed, setDwellElapsed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDwellElapsed(true), LOADING_PAGE_EVENT_DWELL_MS);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      {dwellElapsed && (
        <TrackScreen
          category={PAGE_CONNECT_APP.Loading}
          sourceFlow={sourceFlow}
          modelId={device.modelId}
          refreshSource
          deviceUxV2
        />
      )}
      <LoadingContent
        title={<Trans i18nKey="deviceIntentExecutor.initialization.loading.title" />}
        testID="device-initializer-loading"
      />
    </>
  );
}
