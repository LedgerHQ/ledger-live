import {
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  LogLevel,
  type TransportFactory,
} from "@ledgerhq/device-management-kit";
import { nodeWebUsbTransportFactory, type NodeWebUsbTransport } from "./node-webusb";
import { LedgerLiveLogger } from "@ledgerhq/live-dmk-shared/services/LedgerLiveLogger";
import { UserHashService } from "@ledgerhq/live-dmk-shared/services/UserHashService";
import { getEnv } from "@ledgerhq/live-env";

export type WalletCliDmk = {
  dmk: DeviceManagementKit;
  /**
   * Tear down the underlying node-webusb transport this kit was built with.
   * Bound to *this* kit's transport — building another kit returns its own
   * `destroyTransport` rather than overwriting a shared module-level ref.
   */
  destroyTransport: () => Promise<void>;
};

export function createDeviceManagementKit(): WalletCliDmk {
  const userId = getEnv("USER_ID") || "wallet-cli";
  const firmwareDistributionSalt = UserHashService.compute(userId).firmwareSalt;

  let nodeWebUsbTransport: NodeWebUsbTransport | null = null;
  const captureTransportFactory: TransportFactory = args => {
    const transport = nodeWebUsbTransportFactory(args) as NodeWebUsbTransport;
    nodeWebUsbTransport = transport;
    return transport;
  };

  const dmk = new DeviceManagementKitBuilder()
    .addTransport(captureTransportFactory)
    .addLogger(new LedgerLiveLogger(LogLevel.Warning))
    .addConfig({ firmwareDistributionSalt })
    .build();

  return {
    dmk,
    destroyTransport: async () => {
      const transport = nodeWebUsbTransport;
      nodeWebUsbTransport = null;
      await transport?.destroy();
    },
  };
}
