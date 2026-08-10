import React from "react";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import TrackPage from "~/renderer/analytics/TrackPage";

type TrackDIEScreenProps = React.ComponentProps<typeof TrackPage> & {
  sourceFlow?: never;
  deviceUxV2?: never;
};

export function TrackDIEScreen(props: TrackDIEScreenProps): React.ReactNode {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

  return <TrackPage {...analyticsProperties} {...props} sourceFlow={sourceFlow} deviceUxV2 />;
}
