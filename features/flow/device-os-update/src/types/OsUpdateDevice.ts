import type { DeviceModelId } from "@ledgerhq/device-management-kit";

/** The device the flow runs on, as the app knows it before the flow opens a DMK session lookup. */
export type OsUpdateDevice = Readonly<{
  id: string;
  name: string | null;
  modelId: DeviceModelId;
  wired: boolean;
}>;
