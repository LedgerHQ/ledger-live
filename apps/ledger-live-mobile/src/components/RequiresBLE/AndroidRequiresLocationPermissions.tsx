import React, { ReactNode, useCallback, useEffect, useState } from "react";
import useIsMounted from "@ledgerhq/live-common/hooks/useIsMounted";
import LocationRequired from "../LocationRequired";
import {
  checkLocationPermission,
  locationPermission,
  requestLocationPermission,
  RequestResult,
} from "./androidBlePermissions";

/**
 * Renders an error if location is required & not available,
 * otherwise renders children
 */
const AndroidRequiresLocationPermissions: React.FC<{
  children?: ReactNode | undefined;
}> = ({ children }) => {
  const isMounted = useIsMounted();
  const [requestResult, setRequestResult] = useState<RequestResult | null>(
    null,
  );
  const [checkResult, setCheckResult] = useState<boolean | null>(null);

  const { granted } = requestResult || {};

  const requestPermission = useCallback(() => {
    requestLocationPermission().then(res => {
      if (!isMounted()) return;
      setRequestResult(res);
    });
  }, [isMounted]);

  const checkPermission = useCallback(async () => {
    checkLocationPermission().then(res => {
      if (!isMounted()) return;
      setCheckResult(res);
    });
  }, [isMounted]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  if (!locationPermission) return <>{children}</>;

  if (checkResult || granted) return <>{children}</>;
  if (requestResult === null) return null; // suspense PLZ
  return (
    <LocationRequired errorType="unauthorized" onRetry={checkPermission} />
  );
};

export default AndroidRequiresLocationPermissions;
