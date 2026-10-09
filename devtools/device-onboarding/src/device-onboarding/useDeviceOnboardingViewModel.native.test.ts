import { renderHook } from "@support/jest-devtools/native";
import { buildProps } from "jest/deviceOnboardingProps";
import { statusCopy } from "./configCopy";
import { useDeviceOnboardingViewModel } from "./useDeviceOnboardingViewModel";

describe("useDeviceOnboardingViewModel (native)", () => {
  it("builds the same rows under the React Native runtime", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(
        buildProps({
          status: "running",
          context: { isOnboarded: false },
          state: "readingState",
          log: [{ state: "readingState", event: { id: "first", type: "SESSION_READY", at: 1 } }],
        }),
      ),
    );

    expect(result.current.statusLabel).toBe(statusCopy.running);
    expect(result.current.contextRows).toEqual([{ label: "isOnboarded", value: "false" }]);
    expect(result.current.logLines.find(line => line.line === "event")?.type).toBe("SESSION_READY");
  });

  it("offers a connection again once the host reported a failure", () => {
    const { result } = renderHook(() =>
      useDeviceOnboardingViewModel(buildProps({ status: "connecting", error: "Bluetooth is off" })),
    );

    expect(result.current.canConnect).toBe(true);
  });
});
