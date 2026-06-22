export * from "./live-common-setup-base";
import SpeculosTransport, { SpeculosTransportOpts } from "@ledgerhq/hw-transport-node-speculos";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";
import { closeAllSpeculosDevices } from "@ledgerhq/live-common/load/speculos";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import {
  DeviceManagementKitTransportSpeculos,
  SpeculosHttpTransportOpts,
} from "@ledgerhq/live-dmk-speculos";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";

const NON_SPECULOS_DEVICE_ERROR =
  "This CLI only supports Speculos devices (set SPECULOS_API_PORT or SPECULOS_APDU_PORT). " +
  "To interact with a real Ledger device, use the Ledger Live desktop or mobile app directly, " +
  "or @ledgerhq/wallet-cli if you need a CLI-based flow.";

const { SPECULOS_API_PORT, SPECULOS_APDU_PORT, SPECULOS_BUTTON_PORT, SPECULOS_HOST } = process.env;

if (SPECULOS_API_PORT) {
  registerSpeculosTransport(parseInt(SPECULOS_API_PORT, 10));
} else if (SPECULOS_APDU_PORT) {
  const req: Record<string, any> = {
    apduPort: parseInt(SPECULOS_APDU_PORT, 10),
  };

  if (SPECULOS_BUTTON_PORT) {
    req.buttonPort = parseInt(SPECULOS_BUTTON_PORT, 10);
  }

  if (SPECULOS_HOST) {
    req.host = SPECULOS_HOST;
  }

  registerTransportModule({
    id: "tcp",
    open: () =>
      retry(() => SpeculosTransport.open(req as SpeculosTransportOpts), {
        context: "open-tcp-speculos",
      }),
    disconnect: () => Promise.resolve(),
  });
}

// The CLI no longer ships USB/HID or HTTP-proxy transports: it is Speculos-only.
// This fallback matches any non-Speculos deviceId and fails with an actionable error.
registerTransportModule({
  id: "non-speculos",
  open: () => Promise.reject(new Error(NON_SPECULOS_DEVICE_ERROR)),
  disconnect: () => Promise.resolve(),
});

export function registerSpeculosTransport(apiPort: number) {
  const speculosAddress = process.env.SPECULOS_ADDRESS;
  const req: SpeculosHttpTransportOpts = {
    apiPort: apiPort.toString(),
    ...(speculosAddress && { baseURL: speculosAddress }),
  };

  registerTransportModule({
    id: "speculos-http",
    open: () => retry(() => DeviceManagementKitTransportSpeculos.open(req)),
    disconnect: () => Promise.resolve(),
  });
}

LiveConfig.setConfig(liveConfig);

export function closeAllDevices() {
  closeAllSpeculosDevices();
}

// Setup CAL client store for CLI (automatically set as global store)
setupCalClientStore();
