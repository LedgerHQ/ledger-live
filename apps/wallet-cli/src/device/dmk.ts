import {
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  LogLevel,
  type TransportFactory,
} from "@ledgerhq/device-management-kit";
import { walletCliTransportFactory } from "./dmk-transport-factory";
import { nodeWebUsbTransportFactory, type NodeWebUsbTransport } from "./node-webusb";
import { readSpeculosConfig, type SpeculosConfig } from "./speculos-config";
import { LedgerLiveLogger } from "@ledgerhq/live-dmk-shared/services/LedgerLiveLogger";
import { UserHashService } from "@ledgerhq/live-dmk-shared/services/UserHashService";
import { getEnv } from "@shared/env";

export type WalletCliDmk = {
  dmk: DeviceManagementKit;
  /**
   * Tear down the underlying node-webusb transport this kit was built with (a no-op on Speculos).
   * Bound to *this* kit's transport — building another kit returns its own
   * `destroyTransport` rather than overwriting a shared module-level ref.
   */
  destroyTransport: () => Promise<void>;
};

/**
 * Builds the kit on Speculos when `SPECULOS_API_PORT` or `SPECULOS_ADDRESS` is set, and on the
 * first USB Ledger otherwise. Passing `null` forces USB.
 */
export function createDeviceManagementKit(
  speculos: SpeculosConfig | null = readSpeculosConfig(),
): WalletCliDmk {
  const userId = getEnv("USER_ID") || "wallet-cli";
  const firmwareDistributionSalt = UserHashService.compute(userId).firmwareSalt;

  let nodeWebUsbTransport: NodeWebUsbTransport | null = null;
  const captureTransportFactory: TransportFactory = args => {
    const transport = nodeWebUsbTransportFactory(args) as NodeWebUsbTransport;
    nodeWebUsbTransport = transport;
    return transport;
  };

  const dmk = new DeviceManagementKitBuilder()
    .addTransport(walletCliTransportFactory(captureTransportFactory, speculos))
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
