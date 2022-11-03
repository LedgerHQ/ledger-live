import { useEffect, useState, useCallback } from "react";
import { StoreType } from "../context/LedgerStore";
import { start } from "./segment";

const HookAnalytics = ({ store }: { store: StoreType }) => {
  const [analyticsStarted, setAnalyticsStarted] = useState(false);
  const sync = useCallback(() => {
    if (analyticsStarted) return;
    setAnalyticsStarted(true);
    start(store);
  }, [analyticsStarted, store]);
  useEffect(sync, [sync]);
  return null;
};

export default HookAnalytics;
