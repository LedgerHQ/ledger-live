import { createKeyRingV1DeviceBridge } from "@features/platform-key-ring/v1";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";

/** How the app's key ring client reaches devices: `withDevice`, or the DMK session of a DIE run. */
export const keyRingDeviceBridge = createKeyRingV1DeviceBridge({
  withDevice,
  createSessionTransport: ({ dmk, sessionId }) => new DmkCompatTransport(dmk, sessionId),
});
