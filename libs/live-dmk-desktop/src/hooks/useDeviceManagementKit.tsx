import React from "react";
import {
  DeviceManagementKitProvider as SharedProvider,
  useDeviceManagementKit,
  DeviceManagementKitContext,
  getDeviceManagementKit,
} from "@ledgerhq/live-dmk-shared";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

export { useDeviceManagementKit, DeviceManagementKitContext, getDeviceManagementKit };

type Props = {
  children: React.ReactNode;
  disabled?: boolean;
};

export const DeviceManagementKitProvider: React.FC<Props> = ({ children, disabled }) => {
  const ldmkTransportFlag = !disabled && !!useFeature("ldmkTransport")?.enabled;
  return <SharedProvider disabled={!ldmkTransportFlag}>{children}</SharedProvider>;
};
