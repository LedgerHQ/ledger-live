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

// conditional type used to infer what will be the tuple of returned values of the getBatteryStatus
// command. According to the tuple that of BatteryStatusTypes that is requested, it will infer the corresponding
// tupple of either number or BatteryStatusFlags for the result
type BatteryStatusTuple<Statuses extends ReadonlyArray<BatteryStatusTypes>> = {
  [index in keyof Statuses]: Statuses[index] extends BatteryStatusTypes.BATTERY_FLAGS
    ? BatteryStatusFlags
    : number;
};

const getBatteryStatus = async <StatusesType extends ReadonlyArray<BatteryStatusTypes>>(
  transport: Transport,
  statuses: StatusesType,
): Promise<BatteryStatusTuple<StatusesType>> => {
  const result: (BatteryStatusFlags | number)[] = [];

  for (let i = 0; i < statuses.length; i++) {
    const res = await transport.send(0xe0, 0x10, 0x00, statuses[i]);
    const status = res.readUInt16BE(res.length - 2);

    if (status !== StatusCodes.OK) {
      throw new TransportStatusError(status);
    }

    switch (statuses[i]) {
      case BatteryStatusTypes.BATTERY_PERCENTAGE: {
        // Nb values greater that 100 would mean a bad case
        // to be assessed if we want to break the flow.
        const temp = res.readUInt8(0);
        result[i] = temp > 100 ? -1 : temp;
        break;
      }
      case BatteryStatusTypes.BATTERY_VOLTAGE:
        result[i] = res.readUInt16BE(0);
        break;
      case BatteryStatusTypes.BATTERY_TEMPERATURE:
      case BatteryStatusTypes.BATTERY_CURRENT:
        // Nb turn the usigned byte into a signed int to cover
        // negative values. Two's compliment.
        result[i] = (res.readUInt8() << 24) >> 24;
        break;
      case BatteryStatusTypes.BATTERY_FLAGS: {
        const flags = res.readUInt16BE(2); // Nb Ignoring the first two bytes

        const chargingUSB = !!(flags & FlagMasks.USB_POWERED);
        const chargingQi = !chargingUSB && !!(flags & FlagMasks.CHARGING);

        result[i] = {
          charging: chargingQi
            ? ChargingModes.QI
            : chargingUSB
            ? ChargingModes.USB
            : ChargingModes.NONE,
          issueCharging: !!(flags & FlagMasks.ISSUE_CHARGING),
          issueTemperature: !!(flags & FlagMasks.ISSUE_TEMPERATURE),
          issueBattery: !!(flags & FlagMasks.ISSUE_BATTERY),
        };
        break;
      }
    }
  }

  return result as BatteryStatusTuple<StatusesType>;
};

export default getBatteryStatus;
