import { useEffect, useCallback } from "react";

import { start } from "./segment";
import type { AppStore } from "../reducers";
import { useStore } from "react-redux";

const SegmentSetup = (): null => {
  const store = useStore();
  const loadSegment = useCallback(async (store: AppStore) => {
    try {
      await start(store);
    } catch (error) {
      console.error(`Failed to initialize Segment with error: ${error}`);
    }
  }, []);

  useEffect(() => {
    loadSegment(store);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default SegmentSetup;
