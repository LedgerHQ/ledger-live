import { DeviceModelId } from "@ledgerhq/device-management-kit";

/**
 * Per-model facts the device screen needs. Screen dimensions are not among
 * them: every frame is a PNG that carries its own, so a new model needs no
 * entry here to render — only to be driven.
 */
export interface DeviceScreenModel {
  readonly label: string;
  /** How the device is driven: a touchscreen, or physical buttons. */
  readonly touch: boolean;
  readonly buttons: boolean;
}

const nano = (label: string): DeviceScreenModel => ({ label, touch: false, buttons: true });
const touchscreen = (label: string): DeviceScreenModel => ({ label, touch: true, buttons: false });

export const DEVICE_SCREEN_MODELS: Record<DeviceModelId, DeviceScreenModel> = {
  [DeviceModelId.NANO_S]: nano("Nano S"),
  [DeviceModelId.NANO_SP]: nano("Nano S Plus"),
  [DeviceModelId.NANO_X]: nano("Nano X"),
  [DeviceModelId.STAX]: touchscreen("Stax"),
  [DeviceModelId.FLEX]: touchscreen("Flex"),
  [DeviceModelId.APEX]: touchscreen("Apex"),
};
