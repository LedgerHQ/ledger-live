import React, { ReactNode } from "react";
import { AnalyticsProvider as SegmentAnalyticsProvider } from "@segment/analytics-react-native";
import { start } from "./segment";

const AnalyticsProvider = ({
  store,
  children,
}: {
  store: any;
  children?: ReactNode;
}): JSX.Element => {
  const segmentClient = start(store);
  return (
    <SegmentAnalyticsProvider client={segmentClient}>
      {children}
    </SegmentAnalyticsProvider>
  );
};

export default AnalyticsProvider;
