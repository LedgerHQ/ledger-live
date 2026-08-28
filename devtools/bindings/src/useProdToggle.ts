import { useEffect, useState } from "react";
import { changes, getEnv } from "@shared/env";

export interface ProdToggle {
  useProd: boolean;
  setUseProd: (v: boolean) => void;
  trustchainApiBaseUrl: string;
  cloudSyncApiBaseUrl: string;
}

export function useProdToggle(): ProdToggle {
  const [useProd, setUseProd] = useState(false);
  const [_tick, forceUpdate] = useState(0);

  useEffect(() => {
    const sub = changes.subscribe(() => forceUpdate(n => n + 1));
    return () => sub.unsubscribe();
  }, []);

  return {
    useProd,
    setUseProd,
    trustchainApiBaseUrl: getEnv(useProd ? "TRUSTCHAIN_API_PROD" : "TRUSTCHAIN_API_STAGING"),
    cloudSyncApiBaseUrl: getEnv(useProd ? "CLOUD_SYNC_API_PROD" : "CLOUD_SYNC_API_STAGING"),
  };
}
