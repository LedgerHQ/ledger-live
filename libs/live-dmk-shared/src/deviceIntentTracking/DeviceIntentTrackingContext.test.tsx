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

    expect(result.current).toEqual({
      sourceFlow: "wallet_api",
      analyticsProperties,
      reportFailure: expect.any(Function),
    });
  });

  it("should forward the failure reporter of its value", () => {
    const reportFailure = jest.fn();
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <DeviceIntentTrackingProvider value={{ sourceFlow: "send", reportFailure }}>
        {children}
      </DeviceIntentTrackingProvider>
    );

    const { result } = renderHook(() => useDeviceIntentTracking(), { wrapper });
    result.current.reportFailure(null);

    expect(reportFailure).toHaveBeenCalledWith(null);
  });

  it("should ignore reported failures when no reporter is provided", () => {
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <DeviceIntentTrackingProvider value={{ sourceFlow: "send" }}>
        {children}
      </DeviceIntentTrackingProvider>
    );

    const { result } = renderHook(() => useDeviceIntentTracking(), { wrapper });

    expect(() => result.current.reportFailure(null)).not.toThrow();
  });

  it("should throw when used outside its provider", () => {
    expect(() => renderHook(() => useDeviceIntentTracking())).toThrow(
      "useDeviceIntentTracking must be used inside <DeviceIntentTrackingProvider>",
    );
  });
});
