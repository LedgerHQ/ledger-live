import { useEffect } from "react";
import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";
import { useStore } from "~/context/hooks";
import { analyticsEnabledSelector } from "~/reducers/settings";
import { start } from "./segment";
import useFlushInBackground from "./useFlushInBackground";

const SegmentSetup = (): null => {
  const store = useStore();

  useEffect(() => {
    start(store).catch(error => console.error(`Failed to initialize Segment with error: ${error}`));
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    liveBlindSigningReporter.setConsentSource(() => analyticsEnabledSelector(store.getState()));
  }, [store]);

  useFlushInBackground();

  return null;
};

export default SegmentSetup;
