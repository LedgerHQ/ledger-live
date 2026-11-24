import { renderHook } from "@testing-library/react";
import {
  useDeviceOnboardingToolProps,
  type UseDeviceOnboardingToolPropsInput,
} from "./useDeviceOnboardingToolProps";

const session: UseDeviceOnboardingToolPropsInput["session"] = {
  status: "running",
  device: { name: "Stax", modelId: "stax", sessionId: "session-1", wired: false },
  state: "awaitingStart",
  context: null,
  exit: null,
  sendableEvents: [{ event: { type: "QUIT" } }],
  error: null,
  connect: jest.fn(),
  send: jest.fn(),
  reset: jest.fn(),
};

const toolState: UseDeviceOnboardingToolPropsInput["toolState"] = {
  log: [{ state: "readingState" }],
  machineContext: { isOnboarded: false },
  nextStates: [{ event: "CONTINUE", state: "checks" }],
};

describe("useDeviceOnboardingToolProps", () => {
  it("joins the product session and the tool state", () => {
    const { result } = renderHook(() => useDeviceOnboardingToolProps({ session, toolState }));

    expect(result.current).toEqual({ ...session, ...toolState });
    expect(result.current).not.toHaveProperty("featureFlag");
  });

  it("adds the feature flag switches of a host that edits the flag", () => {
    const featureFlag = {
      featureFlag: { enabled: true, params: { connectUnseededDevice: false } },
      setFeatureFlag: jest.fn(),
      isFeatureFlagOverridden: false,
      resetFeatureFlag: jest.fn(),
    };

    const { result } = renderHook(() =>
      useDeviceOnboardingToolProps({ session, toolState, featureFlag }),
    );

    expect(result.current).toEqual({ ...session, ...toolState, ...featureFlag });
  });

  it("keeps the same props while nothing changes", () => {
    const { result, rerender } = renderHook(() =>
      useDeviceOnboardingToolProps({ session, toolState }),
    );
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
