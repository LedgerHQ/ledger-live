import {
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  LogLevel,
} from "@ledgerhq/device-management-kit";
import { nodeWebUsbTransportFactory } from "./node-webusb";
import { LedgerLiveLogger } from "@ledgerhq/live-dmk-shared/services/LedgerLiveLogger";
import { UserHashService } from "@ledgerhq/live-dmk-shared/services/UserHashService";
import { getEnv } from "@ledgerhq/live-env";

export function createDeviceManagementKit(): DeviceManagementKit {
  const userId = getEnv("USER_ID") || "wallet-cli";
  const firmwareDistributionSalt = UserHashService.compute(userId).firmwareSalt;

  return new DeviceManagementKitBuilder()
    .addTransport(nodeWebUsbTransportFactory)
    .addLogger(new LedgerLiveLogger(LogLevel.Warning))
    .addConfig({ firmwareDistributionSalt })
    .build();
}
