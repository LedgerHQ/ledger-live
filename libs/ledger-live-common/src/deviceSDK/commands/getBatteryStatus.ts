import Transport from "@ledgerhq/hw-transport";
import { BatteryStatusFlags, ChargingModes } from "@ledgerhq/types-devices";
import { TransportStatusError, StatusCodes } from "@ledgerhq/errors";
import { UnresponsiveCmdEvent } from "./core";
import { Observable, from, of } from "rxjs";
import { finalize, switchMap } from "rxjs/operators";
import { BatteryStatusTypes, FlagMasks } from "../../hw/getBatteryStatus";

export type GetBatteryStatusCmdEvent =
  | { type: "data"; batteryStatus: BatteryStatusFlags | number }
  | UnresponsiveCmdEvent;

export type GetBatteryStatusCmdArgs = {
  transport: Transport;
  statusType: BatteryStatusTypes;
};

export function getBatteryStatus({
  transport,
  statusType,
}: GetBatteryStatusCmdArgs): Observable<GetBatteryStatusCmdEvent> {
  return new Observable(subscriber => {
    const oldTimeout = transport.unresponsiveTimeout;
    transport.setExchangeUnresponsiveTimeout(1000);

    const unresponsiveCallback = () => {
      // Needs to push a value and not an error to allow the command to continue once
      // the device is not unresponsive anymore. Pushing an error would stop the command.
      subscriber.next({ type: "unresponsive" });
    };

    transport.on("unresponsive", unresponsiveCallback);

    return from(transport.send(0xe0, 0x10, 0x00, statusType))
      .pipe(
        switchMap((res): Observable<GetBatteryStatusCmdEvent> => {
          transport.off("unresponsive", unresponsiveCallback);

          const status = res.readUInt16BE(res.length - 2);

          if (status !== StatusCodes.OK) {
            throw new TransportStatusError(status);
          }

          switch (statusType) {
            case BatteryStatusTypes.BATTERY_PERCENTAGE: {
              // Nb values greater that 100 would mean a bad case
              // to be assessed if we want to break the flow.
              const temp = res.readUInt8(0);
              return of({
                type: "data",
                batteryStatus: temp > 100 ? -1 : temp,
              });
            }
            case BatteryStatusTypes.BATTERY_VOLTAGE:
              return of({
                type: "data",
                batteryStatus: res.readUInt16BE(0),
              });
            case BatteryStatusTypes.BATTERY_TEMPERATURE:
            case BatteryStatusTypes.BATTERY_CURRENT:
              // Nb turn the usigned byte into a signed int to cover
              // negative values. Two's compliment.
              return of({
                type: "data",
                batteryStatus: (res.readUInt8() << 24) >> 24,
              });
            case BatteryStatusTypes.BATTERY_FLAGS: {
              const flags = res.readUInt16BE(2); // Nb Ignoring the first two bytes

              const chargingUSB = !!(flags & FlagMasks.USB_POWERED);
              const chargingQi = !chargingUSB && !!(flags & FlagMasks.CHARGING);

              return of({
                type: "data",
                batteryStatus: {
                  charging: chargingQi
                    ? ChargingModes.QI
                    : chargingUSB
                    ? ChargingModes.USB
                    : ChargingModes.NONE,
                  issueCharging: !!(flags & FlagMasks.ISSUE_CHARGING),
                  issueTemperature: !!(flags & FlagMasks.ISSUE_TEMPERATURE),
                  issueBattery: !!(flags & FlagMasks.ISSUE_BATTERY),
                },
              });
            }
          }
        }),
        finalize(() => transport.setExchangeUnresponsiveTimeout(oldTimeout)),
      )
      .subscribe(subscriber);
  });
}

export default getBatteryStatus;
