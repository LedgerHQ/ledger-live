import React, { ReactNode, useCallback, useEffect, useState } from "react";
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
  const [requestResult, setRequestResult] = useState<RequestResult | null>(
    null,
  );
  const [checkResult, setCheckResult] = useState<boolean | null>(null);

  const { granted } = requestResult || {};

  const requestPermission = useCallback(async () => {
    let dead = false;
    requestLocationPermission().then(res => {
      if (dead) return;
      setRequestResult(res);
    });
    return () => {
      dead = true;
    };
  }, []);

  const checkPermission = useCallback(async () => {
    let dead = false;
    checkLocationPermission().then(res => {
      if (dead) return;
      setCheckResult(res);
    });
    return () => {
      dead = true;
    };
  }, []);

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
