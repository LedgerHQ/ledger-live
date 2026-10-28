import "../live-common-setup-network";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import {
  DeviceManagementKitBuilder,
  DeviceStatus,
  type DeviceManagementKit,
  type TransportFactory,
} from "@ledgerhq/device-management-kit";
import { MockClient } from "@ledgerhq/device-mockserver-client";
import { mockserverTransportFactory } from "@ledgerhq/device-transport-kit-mockserver";
import { webBleTransportFactory } from "@ledgerhq/device-transport-kit-web-ble";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { listen } from "@ledgerhq/logs";
import { getEnv } from "@shared/env";
import { firstValueFrom, type Subscription } from "rxjs";
import { parseDeviceId, type DeviceTarget } from "./deviceTarget";
import { setMockServerDeviceId, setMockServerToken } from "./mockServerSession";

listen(log => {
  console.log(log.type + ": " + log.message);
});

// Same test seed and device the Ledger Button test dapp provisions on the hosted mock server.
const MOCK_SERVER_TEST_SEED =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const LEDGER_SYNC_APP_NAME = "Ledger Sync";
const MOCK_SERVER_DEVICE = {
  name: "Web Tools Test",
  device_type: "flex" as const,
  connectivity_type: "USB" as const,
  firmware_version: "1.6.1",
  // The coin apps let "Search with device" add accounts to Ledger Sync (same set as the button).
  apps: [
    { name: LEDGER_SYNC_APP_NAME, version: "1.3.0" },
    { name: "Ethereum", version: "1.22.5" },
    { name: "Solana", version: "1.17.1" },
  ],
};

// The emulated device boots on the dashboard, whereas on a real device the user opens the
// app by hand: send the "open application" APDU (E0 D8 00 00 <name>) ourselves.
function openLedgerSyncApp(dmk: DeviceManagementKit, sessionId: string) {
  const name = new TextEncoder().encode(LEDGER_SYNC_APP_NAME);
  return dmk.sendApdu({
    sessionId,
    apdu: new Uint8Array([0xe0, 0xd8, 0x00, 0x00, name.length, ...name]),
  });
}

function transportFactoryOf(
  target: Exclude<DeviceTarget, { kind: "mockserver" }>,
): TransportFactory {
  switch (target.kind) {
    case "webhid":
      return webHidTransportFactory;
    case "webble":
      return webBleTransportFactory;
  }
}

// The hosted mock server (an emulated device behind an HTTP API) needs a session and a device
// before the DMK can talk to it, so building its DMK is asynchronous. With a `joinToken` the
// session already exists: it is reused as is, without overriding its seed.
async function buildMockServerDmk(
  deviceId: string,
  joinToken?: string,
): Promise<DeviceManagementKit> {
  const url = getEnv("MOCK_SERVER_TRANSPORT_URL").replace(/\/+$/, "");
  let token: string;
  if (joinToken) {
    token = joinToken;
    const client = new MockClient(url, { token });
    const session = await client.getSession();
    if (session.devices.length === 0) await client.addDevice({ ...MOCK_SERVER_DEVICE });
  } else {
    const client = new MockClient(url);
    token = await client.authenticate();
    const seedResponse = await fetch(`${url}/sessions/current/seed`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ seed: MOCK_SERVER_TEST_SEED }),
    });
    if (!seedResponse.ok) {
      throw new Error(`Mock server seed override failed: ${seedResponse.status}`);
    }
    await client.addDevice({ ...MOCK_SERVER_DEVICE });
  }
  setMockServerToken(deviceId, token);

  const wsBase = url.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
  return new DeviceManagementKitBuilder()
    .addTransport(mockserverTransportFactory(url, token))
    .addConfig({ mockUrl: url, webSocketUrl: `${wsBase}/secure-channel/${token}` })
    .build();
}

// One DMK per deviceId: a mock server DMK is bound to the session it provisioned.
const dmkByDeviceId = new Map<string, Promise<DeviceManagementKit>>();

function getDmk(deviceId: string, target: DeviceTarget): Promise<DeviceManagementKit> {
  let dmk = dmkByDeviceId.get(deviceId);
  if (!dmk) {
    dmk =
      target.kind === "mockserver"
        ? buildMockServerDmk(deviceId, target.token)
        : Promise.resolve(
            new DeviceManagementKitBuilder().addTransport(transportFactoryOf(target)).build(),
          );
    dmk.catch(() => dmkByDeviceId.delete(deviceId));
    dmkByDeviceId.set(deviceId, dmk);
  }
  return dmk;
}

type SessionCache = {
  dmk: DeviceManagementKit;
  sessionId: string;
  transport: DmkCompatTransport;
  subscription: Subscription;
};
const sessionCaches = new Map<string, SessionCache>();
const openingPromises = new Map<string, Promise<DmkCompatTransport>>();

function clearCache(deviceId: string) {
  sessionCaches.get(deviceId)?.subscription.unsubscribe();
  sessionCaches.delete(deviceId);
}

function evictSession(deviceId: string, { dmk, sessionId }: SessionCache) {
  clearCache(deviceId);
  return dmk.disconnect({ sessionId }).catch(() => {});
}

async function doOpen(deviceId: string, target: DeviceTarget): Promise<DmkCompatTransport> {
  const cached = sessionCaches.get(deviceId);
  if (cached) {
    const state = await firstValueFrom(
      cached.dmk.getDeviceSessionState({ sessionId: cached.sessionId }),
    ).catch(() => null);

    if (state && state.deviceStatus !== DeviceStatus.NOT_CONNECTED) {
      return cached.transport;
    }
    await evictSession(deviceId, cached);
  }

  const dmk = await getDmk(deviceId, target);
  const device = await firstValueFrom(dmk.startDiscovering({})).finally(() =>
    dmk.stopDiscovering().catch(() => {}),
  );
  const sessionId = await dmk.connect({
    device,
    sessionRefresherOptions: { isRefresherDisabled: true },
  });
  if (target.kind === "mockserver") {
    setMockServerDeviceId(deviceId, (await dmk.getConnectedDevice({ sessionId })).id);
    await openLedgerSyncApp(dmk, sessionId);
  }
  const transport = new DmkCompatTransport(dmk, sessionId);

  const clearIfCurrent = () => {
    if (sessionCaches.get(deviceId)?.sessionId === sessionId) clearCache(deviceId);
  };
  const subscription = dmk.getDeviceSessionState({ sessionId }).subscribe({
    next: state => {
      if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) clearIfCurrent();
    },
    error: clearIfCurrent,
    complete: clearIfCurrent,
  });

  sessionCaches.set(deviceId, { dmk, sessionId, transport, subscription });

  return transport;
}

// The deviceId selects the transport (see ./deviceTarget): "webhid", "webble" or "mockserver". Unknown ids are left to other modules.
registerTransportModule({
  id: "dmk",
  open: deviceId => {
    const target = parseDeviceId(deviceId);
    if (!target) return null;
    let opening = openingPromises.get(deviceId);
    if (!opening) {
      opening = doOpen(deviceId, target).finally(() => {
        openingPromises.delete(deviceId);
      });
      openingPromises.set(deviceId, opening);
    }
    return opening;
  },
  disconnect: deviceId => {
    if (!parseDeviceId(deviceId)) return null;
    const cached = sessionCaches.get(deviceId);
    if (!cached) return Promise.resolve();
    clearCache(deviceId);
    return cached.dmk.disconnect({ sessionId: cached.sessionId }).catch(() => {});
  },
});
