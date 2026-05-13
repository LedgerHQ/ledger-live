import type { TransportIdentifier } from "@ledgerhq/device-management-kit";
import type { DeviceModelId } from "@ledgerhq/types-devices";

export type KnownDevice = {
  transport: TransportIdentifier;
  deviceModelId: DeviceModelId;
  id: string;
  name: string | null;
};
