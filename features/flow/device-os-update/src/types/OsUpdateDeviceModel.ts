import type { ComponentType } from "react";
import type { DeviceActionModelId } from "@features/platform-device-action-content";

/** What the flow shows of a device model. Temporary, until `@domain/entity-device-model` exists. */
export type OsUpdateDeviceModel = Readonly<{
  productName: string;
  actionModelId: DeviceActionModelId | null;
  analyticsModelId: string;
  Icon: ComponentType;
}>;
