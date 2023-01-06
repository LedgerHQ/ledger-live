import React, { ReactNode } from "react";
import LocationRequired from "../LocationRequired";
import useAndroidLocationPermission from "./hooks/useAndroidLocationPermission";

/**
 * Renders an error if location is required & not available,
 * otherwise renders children
 */
const AndroidRequiresLocationPermissions: React.FC<{
  children?: ReactNode | undefined;
}> = ({ children }) => {
  const { renderChildren, hasPermission, checkAgain } =
    useAndroidLocationPermission();

  if (hasPermission === undefined) return null; // Prevents blink

  return renderChildren ? (
    <>{children}</>
  ) : (
    <LocationRequired errorType="unauthorized" onRetry={checkAgain} />
  );
};

export default AndroidRequiresLocationPermissions;
