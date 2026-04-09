import { initDmk, LedgerLiveLogger, UserHashService } from "@ledgerhq/live-dmk-shared";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { LogLevel } from "@ledgerhq/device-management-kit";
import { getEnv } from "@ledgerhq/live-env";

export function initialiseDmk(): void {
  const userId = getEnv("USER_ID");
  const firmwareDistributionSalt = UserHashService.compute(userId).firmwareSalt;

  initDmk({
    transports: [webHidTransportFactory],
    loggers: [new LedgerLiveLogger(LogLevel.Debug)],
    config: { firmwareDistributionSalt },
  });
}
