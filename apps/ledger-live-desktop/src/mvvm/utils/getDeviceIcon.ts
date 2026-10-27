import { DeviceModelId } from "@ledgerhq/devices";
import { Nano, NanoGen5, Stax, Flex, LedgerDevices } from "@ledgerhq/lumen-ui-react/symbols";

export type DeviceIconComponent =
  | typeof Stax
  | typeof Flex
  | typeof NanoGen5
  | typeof Nano
  | typeof LedgerDevices;

/** Maps device model to the Top Bar icon (Stax, Flex, Apex, Nano, or generic LedgerDevices). */
export function getDeviceIcon(modelId: DeviceModelId | undefined): DeviceIconComponent {
  switch (modelId) {
    case DeviceModelId.stax:
      return Stax;
    case DeviceModelId.europa:
      return Flex;
    case DeviceModelId.apex:
      return NanoGen5;
    case DeviceModelId.nanoX:
    case DeviceModelId.nanoS:
    case DeviceModelId.nanoSP:
    case DeviceModelId.blue:
      return Nano;
    default:
      return LedgerDevices;
  }
}
