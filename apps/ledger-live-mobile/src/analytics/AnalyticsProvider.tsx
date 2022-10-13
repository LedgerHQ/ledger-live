import React, { ReactNode, useEffect, useState } from "react";
import {
  AnalyticsProvider as SegmentAnalyticsProvider,
  SegmentClient,
} from "@segment/analytics-react-native";
import { start } from "./segment";

const AnalyticsProvider = ({
  store,
  children,
}: {
  store: any;
  children?: ReactNode;
}): JSX.Element | null => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [segmentClient, setSegmentClient] = useState<
    SegmentClient | undefined
  >();

  const loadSegment = async (store: any) => {
    try {
      const result: SegmentClient | undefined = await start(store);
      console.log("------ SEGMENT CLIENT -----");
      console.log(result);
      setSegmentClient(result);
    } catch (error) {
      console.error(`Failed to initialize Segment with error: ${error}`);
    }
    setLoaded(true);
  };

  useEffect(() => {
    console.log("----- LOADING SEGMENT... -----");
    loadSegment(store);
  }, []);

  if (!loaded || !segmentClient) {
    return <>{children}</>;
  }

  return (
    <SegmentAnalyticsProvider client={segmentClient}>
      {children}
    </SegmentAnalyticsProvider>
  );
};

export default AnalyticsProvider;
