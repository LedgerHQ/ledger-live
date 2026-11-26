import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { createKeyRingV1DeviceBridge } from "@features/platform-key-ring/v1";

/** How the app's key ring reaches devices: `withDevice` outside DIE, the DMK session inside. */
export const keyRingDeviceBridge = createKeyRingV1DeviceBridge({
  withDevice,
  createSessionTransport: ({ dmk, sessionId }) => new DmkCompatTransport(dmk, sessionId),
});
