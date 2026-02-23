import { act, renderHook } from "tests/testSetup";
import { useModularDialogNavigation } from "../useModularDialogNavigation";

describe("useModularDialogNavigation", () => {
  it("should initialize with ASSET_SELECTION and FORWARD direction", () => {
    const { result } = renderHook(() => useModularDialogNavigation());
    expect(result.current.currentStep).toBe("ASSET_SELECTION");
    expect(result.current.navigationDirection).toBe("FORWARD");
  });

  it("should initialize with a custom step", () => {
    const { result } = renderHook(() => useModularDialogNavigation("NETWORK_SELECTION"));
    expect(result.current.currentStep).toBe("NETWORK_SELECTION");
  });

  it("should go forward and set direction to FORWARD", async () => {
    const { result } = renderHook(() => useModularDialogNavigation());
    await act(async () => {
      result.current.goToStep("NETWORK_SELECTION");
    });
    expect(result.current.currentStep).toBe("NETWORK_SELECTION");
    expect(result.current.navigationDirection).toBe("FORWARD");
  });

  it("should go backward and set direction to BACKWARD", async () => {
    const { result } = renderHook(() => useModularDialogNavigation("ACCOUNT_SELECTION"));
    await act(async () => {
      result.current.goToStep("NETWORK_SELECTION");
    });
    expect(result.current.currentStep).toBe("NETWORK_SELECTION");
    expect(result.current.navigationDirection).toBe("BACKWARD");
  });

  it("should not change direction if step is the same", async () => {
    const { result } = renderHook(() => useModularDialogNavigation("NETWORK_SELECTION"));
    await act(async () => {
      result.current.goToStep("NETWORK_SELECTION");
    });
    expect(result.current.currentStep).toBe("NETWORK_SELECTION");
    expect(result.current.navigationDirection).toBe("FORWARD");
  });
});
