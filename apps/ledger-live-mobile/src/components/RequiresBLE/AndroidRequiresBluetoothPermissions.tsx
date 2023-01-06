import React, { ReactNode } from "react";
import BluetoothPermissionDenied from "./BluetoothPermissionDenied";
import useAndroidBLEPermissions from "./hooks/useAndroidBLEPermissions";

/**
 * Renders an error if bluetooth is required & not available,
 * otherwise renders children
 */
const AndroidRequiresBluetoothPermissions: React.FC<{
  children?: ReactNode | undefined;
}> = ({ children }) => {
  const { renderChildren, hasPermission, neverAskAgain } =
    useAndroidBLEPermissions();

  if (hasPermission === undefined) return null; // Prevents blink

  return renderChildren ? (
    <>{children}</>
  ) : (
    <BluetoothPermissionDenied neverAskAgain={neverAskAgain} />
  );
};

export default AndroidRequiresBluetoothPermissions;
