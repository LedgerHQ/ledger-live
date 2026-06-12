import {
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  LogLevel,
  type TransportFactory,
} from "@ledgerhq/device-management-kit";
import { nodeWebUsbTransportFactory, type NodeWebUsbTransport } from "./node-webusb";
import type { NobleAdapter, NodeBleTransport } from "./node-ble";
import { LedgerLiveLogger } from "@ledgerhq/live-dmk-shared/services/LedgerLiveLogger";
import { UserHashService } from "@ledgerhq/live-dmk-shared/services/UserHashService";
import { getEnv } from "@ledgerhq/live-env";
import type { WalletCliTransportKind } from "./transport-kind";
import { WalletCliError } from "../shared/wallet-cli-error";

export type WalletCliDmk = {
  dmk: DeviceManagementKit;
  /**
   * Tear down the underlying transport this kit was built with.
   * Bound to *this* kit's transport — building another kit returns its own
   * `destroyTransport` rather than overwriting a shared module-level ref.
   */
  destroyTransport: () => Promise<void>;
};

type TransportSetup = {
  factory: TransportFactory;
  destroyTransport: () => Promise<void>;
};

function setupNodeWebUsbTransport(): TransportSetup {
  let nodeWebUsbTransport: NodeWebUsbTransport | null = null;
  return {
    factory: args => {
      const transport = nodeWebUsbTransportFactory(args) as NodeWebUsbTransport;
      nodeWebUsbTransport = transport;
      return transport;
    },
    destroyTransport: async () => {
      const transport = nodeWebUsbTransport;
      nodeWebUsbTransport = null;
      await transport?.destroy();
    },
  };
}

/**
 * BLE setup is async because `@abandonware/noble` initializes the platform
 * Bluetooth stack at require time — USB runs must never load it.
 */
async function setupNodeBleTransport(): Promise<TransportSetup> {
  // noble is an optionalDependency (BLE is opt-in and its native binding is
  // platform-specific), so a USB-only install can legitimately lack it. Surface
  // a clear, actionable error instead of a raw module-resolution failure.
  let nobleModule: unknown;
  try {
    nobleModule = await import("@abandonware/noble");
  } catch (cause) {
    throw new WalletCliError(
      "ble_dependency_missing",
      "WALLET_CLI_TRANSPORT=ble requires the optional '@abandonware/noble' dependency, " +
        "which is not installed.",
      {
        hint: "Install '@abandonware/noble' to use BLE, or use USB (WALLET_CLI_TRANSPORT=usb, the default).",
        cause,
      },
    );
  }
  const { nodeBleTransportFactory } = await import("./node-ble");
  const resolved = nobleModule as { default?: unknown };
  const noble = (resolved.default ?? nobleModule) as unknown as NobleAdapter;
  const factory = nodeBleTransportFactory(noble);
  let nodeBleTransport: NodeBleTransport | null = null;
  return {
    factory: args => {
      const transport = factory(args) as NodeBleTransport;
      nodeBleTransport = transport;
      return transport;
    },
    destroyTransport: async () => {
      const transport = nodeBleTransport;
      nodeBleTransport = null;
      await transport?.destroy();
    },
  };
}

export async function createDeviceManagementKit(
  transportKind: WalletCliTransportKind = "usb",
): Promise<WalletCliDmk> {
  const userId = getEnv("USER_ID") || "wallet-cli";
  const firmwareDistributionSalt = UserHashService.compute(userId).firmwareSalt;

  const { factory, destroyTransport } =
    transportKind === "ble" ? await setupNodeBleTransport() : setupNodeWebUsbTransport();

  const dmk = new DeviceManagementKitBuilder()
    .addTransport(factory)
    .addLogger(new LedgerLiveLogger(LogLevel.Warning))
    .addConfig({ firmwareDistributionSalt })
    .build();

  return { dmk, destroyTransport };
}
