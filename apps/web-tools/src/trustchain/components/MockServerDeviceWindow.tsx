import React from "react";
import { MockServerDevice } from "@ledgerhq/device-mockserver-react";
import { getEnv } from "@shared/env";
import { useMockServerSession } from "../mockServerSession";

// The package exposes no size prop; `zoom` (unlike `transform`) keeps the window fixed to the
// viewport.
const ZOOM = 1.5;
// Above the device interaction overlay (`z-50`, see DeviceInteractionLayer): it asks to act on
// the device, so the window must stay reachable under it.
const Z_INDEX = 60;

/**
 * Screen of the emulated device behind the active mock server session, as a floating window.
 * Render it next to the overlay rather than inside a sticky or transformed container: those
 * create a stacking context that would trap it under the overlay.
 */
export function MockServerDeviceWindow({ deviceId }: { deviceId: string }) {
  const session = useMockServerSession(deviceId);
  if (!session?.mockDeviceId) return null;

  return (
    <div className="pointer-events-auto relative text-base" style={{ zoom: ZOOM, zIndex: Z_INDEX }}>
      <MockServerDevice
        url={getEnv("MOCK_SERVER_TRANSPORT_URL")}
        token={session.token}
        deviceId={session.mockDeviceId}
        floating
      />
    </div>
  );
}
