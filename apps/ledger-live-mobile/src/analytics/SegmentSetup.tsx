import { useEffect } from "react";
import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";
import { useStore } from "~/context/hooks";
import { trackingEnabledSelector } from "~/reducers/settings";
import { start } from "./segment";

const SegmentSetup = (): null => {
  const store = useStore();

  useEffect(() => {
    start(store).catch(error => console.error(`Failed to initialize Segment with error: ${error}`));
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    liveBlindSigningReporter.setConsentSource(() => trackingEnabledSelector(store.getState()));
  }, [store]);

  return null;
};

export default SegmentSetup;
