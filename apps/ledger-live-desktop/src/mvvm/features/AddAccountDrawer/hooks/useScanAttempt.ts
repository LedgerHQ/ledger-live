import { useCallback, useState } from "react";

export function useScanAttempt(navigateToConnectDevice: () => void) {
  const [scanAttempt, setScanAttempt] = useState(1);

  const retryScan = useCallback(() => {
    setScanAttempt(attempt => attempt + 1);
    navigateToConnectDevice();
  }, [navigateToConnectDevice]);

  return { scanAttempt, retryScan };
}
