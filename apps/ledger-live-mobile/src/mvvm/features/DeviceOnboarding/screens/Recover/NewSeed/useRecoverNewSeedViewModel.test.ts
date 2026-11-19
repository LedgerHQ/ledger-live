import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useRecoverNewSeedViewModel } from "./useRecoverNewSeedViewModel";

const props = {
  onSkip: jest.fn(),
  onRemindLater: jest.fn(),
  onOpenLiveApp: jest.fn(),
  onClose: jest.fn(),
};

describe("useRecoverNewSeedViewModel", () => {
  it("should open Recover directly when the detail flag is off", () => {
    const onOpenLiveApp = jest.fn();
    const { result } = renderHook(() => useRecoverNewSeedViewModel({ ...props, onOpenLiveApp }), {
      overrideInitialState: withFlagOverrides({
        recoverDetailedDrawerOnboarding: { enabled: false },
      }),
    });

    act(() => result.current.onProtect());

    expect(onOpenLiveApp).toHaveBeenCalledTimes(1);
    expect(result.current.sheet).toBeNull();
  });

  it("should open the detail sheet when the flag is on", () => {
    const onOpenLiveApp = jest.fn();
    const onRemindLater = jest.fn();
    const { result } = renderHook(
      () => useRecoverNewSeedViewModel({ ...props, onOpenLiveApp, onRemindLater }),
      {
        overrideInitialState: withFlagOverrides({
          recoverDetailedDrawerOnboarding: { enabled: true },
        }),
      },
    );

    act(() => result.current.onProtect());

    expect(onOpenLiveApp).not.toHaveBeenCalled();
    expect(result.current.sheet?.title).toBe("How does Ledger Recover work?");

    act(() => result.current.sheet?.onStart());
    expect(onOpenLiveApp).toHaveBeenCalledTimes(1);

    act(() => result.current.sheet?.onRemind());
    expect(onRemindLater).toHaveBeenCalledTimes(1);
  });

  it("should hide the sheet while another sheet is on top", () => {
    let suspendSheets = false;
    const { result, rerender } = renderHook(
      () => useRecoverNewSeedViewModel({ ...props, suspendSheets }),
      {
        overrideInitialState: withFlagOverrides({
          recoverDetailedDrawerOnboarding: { enabled: true },
        }),
      },
    );

    act(() => result.current.onProtect());
    expect(result.current.sheet).not.toBeNull();

    suspendSheets = true;
    rerender(undefined);
    expect(result.current.sheet).toBeNull();

    suspendSheets = false;
    rerender(undefined);
    expect(result.current.sheet).not.toBeNull();
  });
});
