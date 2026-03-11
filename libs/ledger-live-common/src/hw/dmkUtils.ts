import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import Transport from "@ledgerhq/hw-transport";

export const isDmkTransport = (
  transport: Transport,
): transport is Transport & { dmk: DeviceManagementKit; sessionId: string } => {
  return (
    "dmk" in transport &&
    transport.dmk !== undefined &&
    "sessionId" in transport &&
    transport.sessionId !== undefined
  );
};
