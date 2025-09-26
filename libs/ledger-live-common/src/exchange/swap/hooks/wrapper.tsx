import React, { useMemo } from "react";
import { CountervaluesMarketcapProvider } from "@ledgerhq/live-countervalues-react";

export const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
  const bridge = useMemo(
    () => ({
      setError: () => {},
      setIds: () => {},
      setLoading: () => {},
      useIds: () => [],
      useLastUpdated: () => 0,
    }),
    [],
  );
  return (
    //@ts-expect-error: rn version alignment issue
    <CountervaluesMarketcapProvider bridge={bridge}>{children}</CountervaluesMarketcapProvider>
  );
};
