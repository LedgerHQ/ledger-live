import React from "react";

type CameraPermissionContext = {
  permissionGranted: boolean | null;
};
const CameraPermissionContext = React.createContext<CameraPermissionContext>({
  permissionGranted: null,
});

export default CameraPermissionContext;
