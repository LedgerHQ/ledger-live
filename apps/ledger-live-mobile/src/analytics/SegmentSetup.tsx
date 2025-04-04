import { useEffect } from "react";
import { useStore } from "react-redux";
import { start } from "./segment";
import useFlushInBackground from "./useFlushInBackground";

const SegmentSetup = (): null => {
  const store = useStore();

  useEffect(() => {
    start(store).catch(error => console.error(`Failed to initialize Segment with error: ${error}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFlushInBackground();

  return null;
};

export default SegmentSetup;
