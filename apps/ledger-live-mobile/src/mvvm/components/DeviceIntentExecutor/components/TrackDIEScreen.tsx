import { TrackScreen } from "@shared/analytics-react";
import React from "react";
import { useDeviceIntentTracking } from "../utils/DeviceIntentTrackingContext";

type TrackDIEScreenProps = React.ComponentProps<typeof TrackScreen> & {
  sourceFlow?: never;
  deviceUxV2?: never;
};

export function TrackDIEScreen(props: TrackDIEScreenProps): React.ReactNode {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

  return <TrackScreen {...analyticsProperties} {...props} sourceFlow={sourceFlow} deviceUxV2 />;
}
