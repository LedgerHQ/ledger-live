import { useState } from "react";

/** The Trustchain and Cloud Sync URLs of one Ledger Sync backend, which must match. */
export interface LedgerSyncBackend {
  trustchainApiBaseUrl: string;
  cloudSyncApiBaseUrl: string;
}

export interface ProdToggle extends LedgerSyncBackend {
  useProd: boolean;
  setUseProd: (v: boolean) => void;
}

/** Starts on the host's staging backend, and switches to its prod one on `setUseProd(true)`. */
export function useProdToggle(backends: {
  prod: LedgerSyncBackend;
  staging: LedgerSyncBackend;
}): ProdToggle {
  const [useProd, setUseProd] = useState(false);
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } = useProd ? backends.prod : backends.staging;
  return { useProd, setUseProd, trustchainApiBaseUrl, cloudSyncApiBaseUrl };
}
