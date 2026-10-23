import { track, trackPage } from "@shared/analytics";
import { Linking } from "react-native";
import { act, renderHook } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { NavigatorName, ScreenName } from "~/const";
import { OnboardingType, type State } from "~/reducers/types";
import { resetSeededOnboardingAnalytics } from "../../analytics/seededTracking";
import { useSyncOfferRouteViewModel } from "./useSyncOfferRouteViewModel";

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
  getCurrentTrackingPage: jest.fn(() => ""),
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
const parentNavigate = jest.fn();
const mockNotifyFlowCompleted = jest.fn();

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotificationsPrompt: () => ({ notifyFlowCompleted: mockNotifyFlowCompleted }),
}));
const listeners = new Map<string, (event: { preventDefault: () => void }) => void>();
const navigation = {
  addListener: (event: string, handler: (event: { preventDefault: () => void }) => void) => {
    listeners.set(event, handler);
    return jest.fn();
  },
  getParent: () => ({
    navigate: parentNavigate,
    reset,
    getParent: () => undefined,
  }),
};

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: () => navigation,
  useRoute: () => ({
    params: {
      device,
      wasReadOnlyAtEntry: true,
    },
  }),
}));

function renderOffer(hasTrustchain: boolean, language?: string) {
  return renderHook(() => useSyncOfferRouteViewModel(), {
    overrideInitialState: (state: State) => ({
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
  });
}

describe("useSyncOfferRouteViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSeededOnboardingAnalytics();
    listeners.clear();
  });

  it("should hand over to Ledger Sync without completing", () => {
    const { result, store } = renderOffer(false);

    act(() => result.current.onActivate());

    expect(parentNavigate).toHaveBeenCalledWith(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncActivationProcess,
      params: { device },
    });
    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);
    expect(store.getState().settings.onboardingType).toBe(OnboardingType.setupNew);
    expect(reset).not.toHaveBeenCalled();
    expect(mockNotifyFlowCompleted).not.toHaveBeenCalled();
  });

  it("should complete when the trustchain lands after the handover", () => {
    const { result, store } = renderOffer(true);

    expect(store.getState().settings.hasCompletedOnboarding).toBe(false);

    act(() => result.current.onActivate());

    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
    expect(store.getState().settings.readOnlyModeEnabled).toBe(false);
    expect(store.getState().settings.hasBeenRedirectedToPostOnboarding).toBe(false);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(mockNotifyFlowCompleted).toHaveBeenCalledTimes(1);
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
    expect(parentNavigate).not.toHaveBeenCalled();
    expect(mockNotifyFlowCompleted).toHaveBeenCalledWith("onboarding");
  });

  it("should complete and open the portfolio when skip is confirmed", () => {
    const { result, store } = renderOffer(false);

    act(() => result.current.onSkip());

    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(parentNavigate).not.toHaveBeenCalled();
    expect(mockNotifyFlowCompleted).toHaveBeenCalledWith("onboarding");
  });

  it("should let Ledger Sync leave once the trustchain has landed", () => {
    const { result } = renderOffer(true);
    const preventDefault = jest.fn();

    act(() => result.current.onActivate());
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
    expect(track).not.toHaveBeenCalledWith("OpenURL", expect.anything());
  });

  it("should open the Ledger Sync Academy page in the app language", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { result } = renderOffer(false, "fr");

    act(() => result.current.onLearnMore());

    expect(openURL).toHaveBeenCalledWith(
      "https://www.ledger.com/fr/academy/topics/ledgersolutions/ledger-sync-effortlessly-sync-your-accounts-in-ledger-live-safely-securely-and-with-complete-privacy",
    );
    expect(track).not.toHaveBeenCalledWith("OpenURL", expect.anything());
  });

  it("should track the sync offer without completing when activation starts", () => {
    const { result } = renderOffer(false);

    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Ledger Sync",
        props: expect.objectContaining({
          platform: "lwm",
          seedConfiguration: "already_seeded",
          deviceType: DeviceModelId.stax,
        }),
      }),
      expect.anything(),
    );

    act(() => result.current.onActivate());

    expect(track).not.toHaveBeenCalledWith("onboarding_done", expect.anything(), expect.anything());
  });

  it("should track sync success and completion when the trustchain lands", () => {
    const { result } = renderOffer(true);

    act(() => result.current.onActivate());

    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Ledger Sync Success" }),
      expect.anything(),
    );
    expect(track).toHaveBeenCalledWith(
      "onboarding_done",
      expect.objectContaining({ ledger_sync_done: "yes" }),
      expect.anything(),
    );
  });

  it("should track the offer again when focus returns after activation", () => {
    const { result } = renderOffer(false);
    const pagesBeforeReturn = jest.mocked(trackPage).mock.calls.length;

    act(() => result.current.onActivate());
    act(() => listeners.get("blur")?.({ preventDefault: jest.fn() }));
    act(() => listeners.get("focus")?.({ preventDefault: jest.fn() }));

    expect(jest.mocked(trackPage).mock.calls.length).toBe(pagesBeforeReturn + 1);
    expect(trackPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: "Ledger Sync" }),
      expect.anything(),
    );
    expect(track).not.toHaveBeenCalledWith("onboarding_done", expect.anything(), expect.anything());
  });

  it("should complete without sync when the offer is skipped", () => {
    const { result } = renderOffer(false);

    act(() => result.current.onSkip());

    expect(track).toHaveBeenCalledWith(
      "onboarding_done",
      expect.objectContaining({ ledger_sync_done: "no" }),
      expect.anything(),
    );
    expect(trackPage).not.toHaveBeenCalledWith(
      expect.objectContaining({ category: "Ledger Sync Success" }),
      expect.anything(),
    );
  });
});
