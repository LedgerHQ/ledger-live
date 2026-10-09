import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { createTestDevice } from "../testing/testDevice";
import { createDeviceOnboardingPorts } from "./ports";

describe("createDeviceOnboardingPorts", () => {
  beforeEach(() => {
    activeDeviceSessionSubject.next(null);
  });

  // Opening the same session again must keep the same Bluetooth connection.
  // A second connection would drop the one the app is using.
  it("keeps the same Bluetooth connection when the same session opens again", async () => {
    const device = createTestDevice();
    const first = createDeviceOnboardingPorts({
      dmk: device.dmk,
      sessionId: device.sessionId,
      wired: false,
    });
    await first.openSession();
    const firstConnection = activeDeviceSessionSubject.value?.transport;

    const second = createDeviceOnboardingPorts({
      dmk: device.dmk,
      sessionId: device.sessionId,
      wired: false,
    });
    await second.openSession();

    expect(activeDeviceSessionSubject.value?.transport).toBe(firstConnection);
  });
});
