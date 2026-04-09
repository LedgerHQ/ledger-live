import { initDmk, LedgerLiveLogger, UserHashService } from "@ledgerhq/live-dmk-shared";
import { RNBleTransportFactory } from "@ledgerhq/device-transport-kit-react-native-ble";
import { RNHidTransportFactory } from "@ledgerhq/device-transport-kit-react-native-hid";
import { LogLevel } from "@ledgerhq/device-management-kit";

export function initialiseDmk(userId: string): void {
  const firmwareDistributionSalt = UserHashService.compute(userId).firmwareSalt;

  initDmk({
    transports: [RNBleTransportFactory, RNHidTransportFactory],
    loggers: [new LedgerLiveLogger(LogLevel.Debug)],
    config: { firmwareDistributionSalt },
  });
}
