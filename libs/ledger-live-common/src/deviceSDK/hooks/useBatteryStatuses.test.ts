import { renderHook } from "@testing-library/react-hooks";
import { useBatteryStatuses } from "./useBatteryStatuses";

describe("useBatteryStatuses", () => {
  it("should return an initial cancelRequest method that is callable", async () => {
    const { result } = renderHook(() => useBatteryStatuses({ statuses: [] }));
    expect(() => result.current.cancelRequest()).not.toThrow();
  });
});
