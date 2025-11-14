/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useBatteryStatuses } from "./useBatteryStatuses";

describe("useBatteryStatuses", () => {
  it("should return an initial cancelRequest method that is callable", async () => {
    const { result } = renderHook(() =>
      useBatteryStatuses({ deviceName: null, statuses: [], enabled: true }),
    );
    expect(() => result.current.cancelRequest()).not.toThrow();
  });
});
