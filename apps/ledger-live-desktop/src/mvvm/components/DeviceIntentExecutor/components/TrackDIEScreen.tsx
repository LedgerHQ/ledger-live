import React from "react";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "@shared/analytics-react";

type TrackDIEScreenProps = React.ComponentProps<typeof TrackScreen> & {
  sourceFlow?: never;
  deviceUxV2?: never;
};

export function TrackDIEScreen(props: TrackDIEScreenProps): React.ReactNode {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

  return <TrackScreen {...analyticsProperties} {...props} sourceFlow={sourceFlow} deviceUxV2 />;
}
