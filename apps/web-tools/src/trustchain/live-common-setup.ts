import "../live-common-setup-network";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { DeviceManagementKitBuilder, DeviceStatus } from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { listen } from "@ledgerhq/logs";
import { firstValueFrom, type Subscription } from "rxjs";

listen(log => {
  console.log(log.type + ": " + log.message);
});

const dmk = new DeviceManagementKitBuilder().addTransport(webHidTransportFactory).build();

type SessionCache = {
  sessionId: string;
  transport: DmkCompatTransport;
  subscription: Subscription;
};
let sessionCache: SessionCache | null = null;
let openingPromise: Promise<DmkCompatTransport> | null = null;

function clearCache() {
  sessionCache?.subscription.unsubscribe();
  sessionCache = null;
}

function evictSession(sessionId: string) {
  clearCache();
  return dmk.disconnect({ sessionId }).catch(() => {});
}

async function doOpen(): Promise<DmkCompatTransport> {
  if (sessionCache) {
    const state = await firstValueFrom(
      dmk.getDeviceSessionState({ sessionId: sessionCache.sessionId }),
    ).catch(() => null);

    if (state && state.deviceStatus !== DeviceStatus.NOT_CONNECTED) {
      return sessionCache.transport;
    }
    await evictSession(sessionCache.sessionId);
  }

  const device = await firstValueFrom(dmk.startDiscovering({})).finally(() =>
    dmk.stopDiscovering().catch(() => {}),
  );
  const sessionId = await dmk.connect({
    device,
    sessionRefresherOptions: { isRefresherDisabled: true },
  });
  const transport = new DmkCompatTransport(dmk, sessionId);

  const subscription = dmk.getDeviceSessionState({ sessionId }).subscribe({
    next: state => {
      if (
        state.deviceStatus === DeviceStatus.NOT_CONNECTED &&
        sessionCache?.sessionId === sessionId
      ) {
        clearCache();
      }
    },
    error: () => {
      if (sessionCache?.sessionId === sessionId) clearCache();
    },
    complete: () => {
      if (sessionCache?.sessionId === sessionId) clearCache();
    },
  });

  sessionCache = { sessionId, transport, subscription };

  return transport;
}

registerTransportModule({
  id: "dmk",
  open: () => {
    if (!openingPromise) {
      openingPromise = doOpen().finally(() => {
        openingPromise = null;
      });
    }
    return openingPromise;
  },
  disconnect: () => {
    if (!sessionCache) return Promise.resolve();
    const { sessionId } = sessionCache;
    clearCache();
    return dmk.disconnect({ sessionId }).catch(() => {});
  },
});
