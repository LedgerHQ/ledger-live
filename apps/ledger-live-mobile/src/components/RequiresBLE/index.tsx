// renders children if BLE is available
// otherwise render an error
import React from "react";
import { Platform } from "react-native";
import AndroidRequiresBluetoothPermissions from "./AndroidRequiresBluetoothPermissions";
import AndroidRequiresLocationPermissions from "./AndroidRequiresLocationPermissions";
import RequiresBluetoothEnabled from "./RequiresBluetoothEnabled";

type Props = {
  children: React.ReactNode;
};

const RequiresBLE: React.FC<Props> = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  if (Platform.OS === "android") {
    return (
      <AndroidRequiresBluetoothPermissions>
        <AndroidRequiresLocationPermissions>
          <RequiresBluetoothEnabled>{children}</RequiresBluetoothEnabled>
        </AndroidRequiresLocationPermissions>
      </AndroidRequiresBluetoothPermissions>
    );
  }

  return <RequiresBluetoothEnabled>{children}</RequiresBluetoothEnabled>;
};

export default RequiresBLE;
