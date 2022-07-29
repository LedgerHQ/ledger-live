import React, { useEffect } from "react";
import { KYC_STATUS } from "../utils";
import { getKYCStatus } from "..";

// Poll the server to update the KYC status of a given provider.
export const KYC_STATUS_POLLING_INTERVAL = 10000;

export type KYCItem = {
  id: string;
  status: string;
};

export type UsePollKYCStatusProps = {
  provider?: string;
  kyc?: KYCItem;
  onChange: (item: KYCItem) => void;
};

export const usePollKYCStatus = (
  { provider, kyc, onChange }: UsePollKYCStatusProps,
  dependencies: React.DependencyList = []
): void => {
  useEffect(
    () => {
      if (kyc?.status !== KYC_STATUS.pending) return;

      let cancelled = false;
      const intervalId = setInterval(
        updateKYCStatus,
        KYC_STATUS_POLLING_INTERVAL
      );
      updateKYCStatus();

      return () => {
        cancelled = true;
        clearInterval(intervalId);
      };

      async function updateKYCStatus() {
        if (!provider || !kyc?.id) return;
        const res = await getKYCStatus(provider, kyc.id);
        if (cancelled || res?.status === kyc?.status) return;
        onChange(res);
      }
    },
    // eslint-disable-next-line
    [provider, kyc, ...dependencies]
  );
};
