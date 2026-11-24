import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { SeedPath } from "@features/platform-device-onboarding";
import { track, trackPage } from "@shared/analytics";
import { unseededProps } from "@features/platform-device-onboarding-analytics";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useRecoverNewSeedViewModel } from "./useRecoverNewSeedViewModel";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
  trackPage: jest.fn(),
}));

/** Pages and events in the order they were sent: `Page <name>`, or the event and its button. */
function sentInOrder(): string[] {
  const sent: string[] = [];
  jest.mocked(trackPage).mockImplementation(({ category }) => {
    sent.push(`Page ${category}`);
  });
  jest.mocked(track).mockImplementation(async (event, eventProps) => {
    const button = (eventProps as Record<string, unknown> | undefined)?.button;
    sent.push(button ? `${event} ${String(button)}` : event);
  });
  return sent;
}

const props = {
  onSkip: jest.fn(),
  onRemindLater: jest.fn(),
  onOpenLiveApp: jest.fn(),
  onClose: jest.fn(),
};

describe("useRecoverNewSeedViewModel", () => {
  it("should send the Ledger Recover events of the tracking plan, once each", () => {
    const sent = sentInOrder();
    const funnel = {
      props: unseededProps(DeviceModelId.STAX, SeedPath.NewSeed),
      status: { ledgerSyncEligible: true, firmwareUpdateAvailability: "no" as const },
    };
    const { result, rerender } = renderHook(
      () => useRecoverNewSeedViewModel({ ...props, funnel }),
      {
        overrideInitialState: withFlagOverrides({
          recoverDetailedDrawerOnboarding: { enabled: true },
        }),
      },
    );

    act(() => result.current.onAdvance(1));
    act(() => result.current.onAdvance(2));
    act(() => result.current.onAdvance(3));
    act(() => result.current.onProtect());
    rerender(undefined as never);

    expect(sent).toEqual([
      "onboarding_Ledger_Recover",
      "Page Karaoke Ledger Recover",
      "karaoke_advanced",
      "karaoke_advanced",
      "Page Ledger Recover Onboarding",
      "button_clicked Protect my wallet",
      "Page Ledger Recover bottom sheet",
    ]);
    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Karaoke Ledger Recover",
        props: expect.objectContaining({ karaokeType: "Ledger Recover", phraseCount: 3 }),
      }),
      expect.anything(),
    );
  });

  it("should send nothing without a tracked funnel", () => {
    const sent = sentInOrder();
    const { result } = renderHook(() => useRecoverNewSeedViewModel(props));

    act(() => result.current.onAdvance(1));
    act(() => result.current.onAdvance(3));
    act(() => result.current.onSkip());

    expect(sent).toEqual([]);
  });

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
