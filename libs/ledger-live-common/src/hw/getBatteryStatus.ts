import Transport from "@ledgerhq/hw-transport";
import { BatteryStatusFlags, ChargingModes } from "@ledgerhq/types-devices";
import { TransportStatusError, StatusCodes } from "@ledgerhq/errors";

export enum BatteryStatusTypes {
  BATTERY_PERCENTAGE = 0x00,
  BATTERY_VOLTAGE = 0x01,
  BATTERY_TEMPERATURE = 0x02,
  BATTERY_CURRENT = 0x03,
  BATTERY_FLAGS = 0x04,
}

// Nb USB and BLE masks not used by implementation since we have
// them from the model.
enum FlagMasks {
  CHARGING = 0x00000001,
  USB = 0x00000002,
  USB_POWERED = 0x00000008,
  BLE = 0x00000004,
  ISSUE_BATTERY = 0x00000080,
  ISSUE_CHARGING = 0x00000010,
  ISSUE_TEMPERATURE = 0x00000020,
}

const getBatteryStatus = async (
  transport: Transport,
  p2: BatteryStatusTypes = BatteryStatusTypes.BATTERY_FLAGS
): Promise<BatteryStatusFlags | number> => {
  const res = await transport.send(0xe0, 0x10, 0x00, p2);
  const status = res.readUInt16BE(res.length - 2);

  if (status === StatusCodes.OK) {
    switch (p2) {
      case BatteryStatusTypes.BATTERY_PERCENTAGE: {
        // Nb values greater that 100 would mean a bad case
        // to be assessed if we want to break the flow.
        const temp = res.readUInt8(0);
        return temp > 100 ? -1 : temp;
      }

      case BatteryStatusTypes.BATTERY_VOLTAGE:
        return res.readUInt16BE(0);

      case BatteryStatusTypes.BATTERY_TEMPERATURE:
      case BatteryStatusTypes.BATTERY_CURRENT:
        // Nb turn the usigned byte into a signed int to cover
        // negative values. Two's compliment.
        return (res.readUInt8() << 24) >> 24;

      case BatteryStatusTypes.BATTERY_FLAGS: {
        const flags = res.readUInt16BE(2); // Nb Ignoring the first two bytes

        const chargingUSB = !!(flags & FlagMasks.USB_POWERED);
        const chargingQi = !chargingUSB && !!(flags & FlagMasks.CHARGING);

        return {
          charging: chargingQi
            ? ChargingModes.QI
            : chargingUSB
            ? ChargingModes.USB
            : ChargingModes.NONE,
          issueCharging: !!(flags & FlagMasks.ISSUE_CHARGING),
          issueTemperature: !!(flags & FlagMasks.ISSUE_TEMPERATURE),
          issueBattery: !!(flags & FlagMasks.ISSUE_BATTERY),
        };
      }
    }
  }

  throw new TransportStatusError(status);
};

export default getBatteryStatus;
