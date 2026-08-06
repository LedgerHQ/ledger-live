import React from "react";
import { renderHook } from "@testing-library/react";
import {
  DeviceIntentTrackingProvider,
  useDeviceIntentTracking,
} from "./DeviceIntentTrackingContext";

describe("DeviceIntentTrackingContext", () => {
  it("should provide source flow and analytics properties", () => {
    const analyticsProperties = { manifestId: "example-app" };
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <DeviceIntentTrackingProvider value={{ sourceFlow: "wallet_api", analyticsProperties }}>
        {children}
      </DeviceIntentTrackingProvider>
    );

    const { result } = renderHook(() => useDeviceIntentTracking(), { wrapper });

    expect(result.current).toEqual({ sourceFlow: "wallet_api", analyticsProperties });
  });

  it("should throw when used outside its provider", () => {
    expect(() => renderHook(() => useDeviceIntentTracking())).toThrow(
      "useDeviceIntentTracking must be used inside <DeviceIntentTrackingProvider>",
    );
  });
});
