import { initDmk, LedgerLiveLogger, UserHashService } from "@ledgerhq/live-dmk-shared";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { LogLevel } from "@ledgerhq/device-management-kit";

export function initialiseDmk(userId: string): void {
  const firmwareDistributionSalt = UserHashService.compute(userId).firmwareSalt;

  initDmk({
    transports: [webHidTransportFactory],
    loggers: [new LedgerLiveLogger(LogLevel.Debug)],
    config: { firmwareDistributionSalt },
  });
}
