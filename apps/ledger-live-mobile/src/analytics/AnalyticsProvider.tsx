import React, { ReactNode, useEffect, useState, useCallback } from "react";
import {
  AnalyticsProvider as SegmentAnalyticsProvider,
  SegmentClient,
} from "@segment/analytics-react-native";
import { start } from "./segment";
import type { AppStore } from "../reducers";

const AnalyticsProvider = ({
  store,
  children,
}: {
  store: AppStore;
  children?: ReactNode;
}): JSX.Element | null => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [segmentClient, setSegmentClient] = useState<
    SegmentClient | undefined
  >();

  const loadSegment = useCallback(async (store: AppStore) => {
    try {
      const result: SegmentClient | undefined = await start(store);
      setSegmentClient(result);
    } catch (error) {
      console.error(`Failed to initialize Segment with error: ${error}`);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadSegment(store);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
