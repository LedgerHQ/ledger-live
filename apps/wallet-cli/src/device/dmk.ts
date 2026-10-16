import {
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  LogLevel,
  type TransportFactory,
} from "@ledgerhq/device-management-kit";
import { nodeWebUsbTransportFactory, type NodeWebUsbTransport } from "./node-webusb";
import { LedgerLiveLogger } from "@ledgerhq/live-dmk-shared/services/LedgerLiveLogger";
import { UserHashService } from "@ledgerhq/live-dmk-shared/services/UserHashService";
import {
  speculosTargetTransportFactory,
  type SpeculosTarget,
} from "@ledgerhq/live-dmk-shared/transport/speculosTarget";
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

/** Builds the kit on the given Speculos target, or on the first USB Ledger when it is `null`. */
export function createDeviceManagementKit(speculos: SpeculosTarget | null): WalletCliDmk {
  const userId = getEnv("USER_ID") || "wallet-cli";
  const firmwareDistributionSalt = UserHashService.compute(userId).firmwareSalt;

  let nodeWebUsbTransport: NodeWebUsbTransport | null = null;
  const captureTransportFactory: TransportFactory = args => {
    const transport = nodeWebUsbTransportFactory(args) as NodeWebUsbTransport;
    nodeWebUsbTransport = transport;
    return transport;
  };

  const dmk = new DeviceManagementKitBuilder()
    .addTransport(speculos ? speculosTargetTransportFactory(speculos) : captureTransportFactory)
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
