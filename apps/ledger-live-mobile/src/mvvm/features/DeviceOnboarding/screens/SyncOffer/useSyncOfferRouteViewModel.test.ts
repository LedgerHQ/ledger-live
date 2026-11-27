import { track, trackPage } from "@shared/analytics";
import { Linking } from "react-native";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { NavigatorName, ScreenName } from "~/const";
import { OnboardingType } from "~/reducers/types";
import { syncOfferSettleDelay, useSyncOfferRouteViewModel } from "./useSyncOfferRouteViewModel";

const mockWalletSyncState = { visualPending: false };

jest.mock("LLM/features/WalletSync/components/WalletSyncContext", () => ({
  useWalletSyncUserState: () => mockWalletSyncState,
}));

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
  getPreviousTrackingPage: jest.fn(() => "Ledger Sync"),
}));

const device = {
  deviceId: "device-id",
  deviceName: "Ledger Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

const trustchain = {
  rootId: "rootId",
  applicationPath: "applicationPath",
  walletSyncEncryptionKey: "walletSyncEncryptionKey",
};

const reset = jest.fn();
const navigate = jest.fn();
const goBack = jest.fn();
const mockNotifyFlowCompleted = jest.fn();
const mockOfferParams: { unseeded?: boolean; seededResult?: null } = {};

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotificationsPrompt: () => ({ notifyFlowCompleted: mockNotifyFlowCompleted }),
}));
const listeners = new Map<string, (event: { preventDefault: () => void }) => void>();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: () => ({
    navigate,
    goBack,
    addListener: (event: string, handler: (event: { preventDefault: () => void }) => void) => {
      listeners.set(event, handler);
      return jest.fn();
    },
    getParent: () => ({
      reset,
      getState: () => ({ routes: [{ name: "BaseOnboarding" }] }),
      getParent: () => undefined,
    }),
  }),
  useRoute: () => ({
    params: {
      device,
      wasReadOnlyAtEntry: true,
      seededResult: {
        deviceType: "stax",
        ledgerSyncEligible: true,
        firmwareUpdateAvailability: "no",
        firmwareUpdateStarted: false,
        firmwareUpdateDone: false,
      },
      ...mockOfferParams,
    },
  }),
}));

function renderOffer(hasTrustchain: boolean, language?: string, ledgerSyncDie = false) {
  return renderHook(() => useSyncOfferRouteViewModel(), {
    overrideInitialState: withFlagOverrides(
      { lwmLedgerSyncDie: { enabled: ledgerSyncDie } },
      state => ({
        ...state,
        settings: {
          ...state.settings,
          ...(language ? { language } : {}),
          readOnlyModeEnabled: true,
          hasCompletedOnboarding: false,
          hasBeenRedirectedToPostOnboarding: true,
        },
        trustchain: {
          ...state.trustchain,
          trustchain: hasTrustchain ? trustchain : null,
        },
      }),
    ),
  });
}

describe("useSyncOfferRouteViewModel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    listeners.clear();
    mockWalletSyncState.visualPending = false;
    delete mockOfferParams.unseeded;
    delete mockOfferParams.seededResult;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should hand over to Ledger Sync without completing", () => {
    const { result, store } = renderOffer(false);

    act(() => result.current.onActivate());

    expect(navigate).toHaveBeenCalledWith(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncActivationProcess,
      params: { device, seededOffer: true },
    });
    expect(result.current.phase).toBe("offer");
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(store.getState().settings.onboardingType).toBe(OnboardingType.setupNew);
    expect(reset).not.toHaveBeenCalled();
    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
  });

  it("should open the Ledger Sync device step over the offer when DIE runs it", () => {
    const { result, store } = renderOffer(false, undefined, true);

    act(() => result.current.onActivate());

    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.phase).toBe("offer");
    expect(store.getState().settings.onboardingType).toBe(OnboardingType.setupNew);
  });

  it("should show synchronizing until the first sync round settles", () => {
    const { result, store } = renderOffer(true);

    expect(result.current.phase).toBe("offer");
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);

    act(() => result.current.onActivate());

    expect(result.current.phase).toBe("synchronizing");
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(store.getState().settings.readOnlyModeEnabled).toBe(true);
    expect(reset).not.toHaveBeenCalled();
    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(syncOfferSettleDelay(1000));
    });

    expect(result.current.phase).toBe("success");
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
  });

  it("should keep synchronizing while accounts are still syncing", () => {
    mockWalletSyncState.visualPending = true;
    const { result, rerender } = renderOffer(true);

    act(() => result.current.onActivate());
    act(() => {
      jest.advanceTimersByTime(syncOfferSettleDelay(1000));
    });

    expect(result.current.phase).toBe("synchronizing");

    mockWalletSyncState.visualPending = false;
    rerender(undefined as never);

    expect(result.current.phase).toBe("success");
  });

  it("should keep the success screen when a later sync round starts", () => {
    const { result, rerender } = renderOffer(true);

    act(() => result.current.onActivate());
    act(() => {
      jest.advanceTimersByTime(syncOfferSettleDelay(1000));
    });
    expect(result.current.phase).toBe("success");

    mockWalletSyncState.visualPending = true;
    rerender(undefined as never);

    expect(result.current.phase).toBe("success");
  });

  it("should complete and open the portfolio from the success screen after activation", () => {
    const { result, store } = renderOffer(true);

    act(() => result.current.onActivate());
    act(() => {
      jest.advanceTimersByTime(syncOfferSettleDelay(1000));
    });
    act(() => result.current.onContinue());

    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
    expect(store.getState().settings.readOnlyModeEnabled).toBe(false);
    expect(store.getState().settings.hasBeenRedirectedToPostOnboarding).toBe(false);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(mockNotifyFlowCompleted).toHaveBeenCalledTimes(1);
    expect(mockNotifyFlowCompleted).toHaveBeenCalledWith("onboarding");
  });

  it("should complete and open the portfolio when quitting the success screen", () => {
    const { result, store } = renderOffer(true);

    act(() => result.current.onActivate());
    act(() => {
      jest.advanceTimersByTime(syncOfferSettleDelay(1000));
    });
    expect(result.current.phase).toBe("success");

    act(() => result.current.onQuit());

    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
    expect(store.getState().settings.readOnlyModeEnabled).toBe(false);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(mockNotifyFlowCompleted).toHaveBeenCalledWith("onboarding");
  });

  it("should keep the offer in place when Ledger Sync is abandoned", () => {
    const { store } = renderOffer(false);
    const preventDefault = jest.fn();

    act(() => listeners.get("beforeRemove")?.({ preventDefault }));

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(reset).not.toHaveBeenCalled();
  });

  it("should complete and open the portfolio when a genuine device quits the offer", () => {
    const { result, store } = renderOffer(false);

    act(() => result.current.onQuit());

    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
    expect(store.getState().settings.readOnlyModeEnabled).toBe(false);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(mockNotifyFlowCompleted).toHaveBeenCalledWith("onboarding");
  });

  it("should complete and open the portfolio when skip is confirmed", () => {
    const { result, store } = renderOffer(false);

    act(() => result.current.onSkip());

    expect(result.current.phase).toBe("offer");
    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
    expect(store.getState().settings.readOnlyModeEnabled).toBe(false);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(mockNotifyFlowCompleted).toHaveBeenCalledWith("onboarding");
  });

  it("should return to the funnel without completing when an unseeded setup skips the offer", () => {
    mockOfferParams.unseeded = true;
    mockOfferParams.seededResult = null;
    const { result, store } = renderOffer(false);

    act(() => result.current.onSkip());

    expect(goBack).toHaveBeenCalledTimes(1);
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(store.getState().settings.readOnlyModeEnabled).toBe(true);
    expect(reset).not.toHaveBeenCalled();
    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
  });

  it("should return to the funnel without completing when an unseeded sync finishes", () => {
    mockOfferParams.unseeded = true;
    mockOfferParams.seededResult = null;
    const { result, store } = renderOffer(true);

    act(() => result.current.onActivate());
    act(() => {
      jest.advanceTimersByTime(syncOfferSettleDelay(1000));
    });
    act(() => result.current.onContinue());

    expect(goBack).toHaveBeenCalledTimes(1);
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(reset).not.toHaveBeenCalled();
    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
  });

  it("should keep the offer in place after the trustchain lands", () => {
    const { result, store } = renderOffer(true);
    const preventDefault = jest.fn();

    act(() => result.current.onActivate());
    act(() => listeners.get("beforeRemove")?.({ preventDefault }));

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(reset).not.toHaveBeenCalled();
  });

  it("should let the offer leave once continue is pressed", () => {
    const { result } = renderOffer(true);
    const preventDefault = jest.fn();

    act(() => result.current.onActivate());
    act(() => result.current.onContinue());
    act(() => listeners.get("beforeRemove")?.({ preventDefault }));

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("should open the Ledger Sync Academy page from learn more", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { result } = renderOffer(false, "en");

    act(() => result.current.onLearnMore());

    expect(openURL).toHaveBeenCalledWith(
      "https://www.ledger.com/academy/topics/ledgersolutions/ledger-sync-effortlessly-sync-your-accounts-in-ledger-live-safely-securely-and-with-complete-privacy",
    );
  });

  it("should open the Ledger Sync Academy page in the app language", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { result } = renderOffer(false, "fr");

    act(() => result.current.onLearnMore());

    expect(openURL).toHaveBeenCalledWith(
      "https://www.ledger.com/fr/academy/topics/ledgersolutions/ledger-sync-effortlessly-sync-your-accounts-in-ledger-live-safely-securely-and-with-complete-privacy",
    );
  });

  it("should track the offer as the seeded device", () => {
    const { result } = renderOffer(false);

    expect(result.current.funnelProps).toMatchObject({
      "onboarding type": "seeded device",
      deviceType: "stax",
    });
  });

  it("should not complete when activation starts without a trustchain", () => {
    const { result } = renderOffer(false);

    act(() => result.current.onActivate());

    expect(track).not.toHaveBeenCalledWith("onboarding_done", expect.anything());
  });

  it("should track completion with sync once the success screen shows", () => {
    const { result } = renderOffer(true);

    act(() => result.current.onActivate());
    expect(track).not.toHaveBeenCalledWith("onboarding_done", expect.anything());

    act(() => {
      jest.advanceTimersByTime(syncOfferSettleDelay(1000));
    });
    act(() => result.current.onContinue());

    const done = jest.mocked(track).mock.calls.filter(([event]) => event === "onboarding_done");
    expect(done).toEqual([
      [
        "onboarding_done",
        expect.objectContaining({ ledger_sync_done: "yes", firmware_update_done: "no" }),
      ],
    ]);
  });

  it("should track completion with sync when the user quits while it synchronizes", () => {
    const { result } = renderOffer(true);

    act(() => result.current.onActivate());
    act(() => result.current.onQuit());

    expect(track).toHaveBeenCalledWith(
      "onboarding_done",
      expect.objectContaining({ ledger_sync_done: "yes" }),
    );
  });

  it("should hide the glow for a seeded device and show it for an unseeded device", () => {
    const seeded = renderOffer(false);
    expect(seeded.result.current.showGlow).toBe(false);

    mockOfferParams.unseeded = true;
    mockOfferParams.seededResult = null;
    const unseeded = renderOffer(false);
    expect(unseeded.result.current.showGlow).toBe(true);
  });

  it("should complete without sync when the offer is skipped", () => {
    const { result } = renderOffer(false);

    act(() => result.current.onSkip());

    expect(track).toHaveBeenCalledWith(
      "onboarding_done",
      expect.objectContaining({ ledger_sync_done: "no" }),
    );
    expect(trackPage).not.toHaveBeenCalled();
  });
});
