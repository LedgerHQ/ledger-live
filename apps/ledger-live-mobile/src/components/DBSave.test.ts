import { AppState, type AppStateStatus } from "react-native";
import { act, renderHook } from "@tests/test-renderer";
import { saveSettings } from "~/db";
import { setTheme } from "~/actions/settings";
import {
  ConfigureDBSaveEffects,
  featureFlagsLense,
  payCardDbSaveSliceSelector,
  payCardPersistedSelector,
} from "./DBSave";
import type { State } from "~/reducers/types";

jest.mock("~/db");

describe("ConfigureDBSaveEffects", () => {
  let appStateListener: (nextAppState: AppStateStatus) => void;
  let addEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.mocked(saveSettings).mockClear();
    addEventListenerSpy = jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_event, listener) => {
        appStateListener = listener;
        return { remove: jest.fn() };
      });
  });

  afterEach(() => {
    jest.useRealTimers();
    addEventListenerSpy.mockRestore();
  });

  it("saves a change made just before the app goes to the background", async () => {
    const { store } = renderHook(() => ConfigureDBSaveEffects());
    act(() => {
      store.dispatch(setTheme("dark"));
    });
    expect(saveSettings).not.toHaveBeenCalled();

    await act(async () => {
      appStateListener("background");
    });

    expect(saveSettings).toHaveBeenCalledWith(expect.objectContaining({ theme: "dark" }), true);
  });

  it("saves a change made during a save in flight when the app goes to the background", async () => {
    let finishFirstSave: (() => void) | undefined;
    jest
      .mocked(saveSettings)
      .mockImplementationOnce(() => new Promise<void>(resolve => (finishFirstSave = resolve)));
    const { store } = renderHook(() => ConfigureDBSaveEffects());
    act(() => {
      store.dispatch(setTheme("dark"));
    });
    await act(async () => {
      appStateListener("background");
    });
    act(() => {
      store.dispatch(setTheme("light"));
    });

    await act(async () => {
      appStateListener("background");
      finishFirstSave?.();
    });

    expect(saveSettings).toHaveBeenCalledTimes(2);
    expect(saveSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({ theme: "light" }),
      true,
    );
  });
});

describe("featureFlagsLense", () => {
  it("projects only { overrides, bannerVisible } — never the transient readiness flags", () => {
    const overrides = { mockFeature: { enabled: true } };
    const state = {
      featureFlags: {
        overrides,
        bannerVisible: false,
        remoteFlagsReady: true,
        cachedFlagsSettled: true,
      },
    } as unknown as State;

    const projected = featureFlagsLense(state);

    expect(projected).toEqual({ overrides, bannerVisible: false });
    expect(projected).not.toHaveProperty("remoteFlagsReady");
    expect(projected).not.toHaveProperty("cachedFlagsSettled");
  });
});

describe("payCardPersistedSelector (mobile persistence lens)", () => {
  it("composes the pay card flow slices into one persisted blob", () => {
    const state = {
      payCardFeatureTour: { hasSeenFeatureTour: true },
      payRequestVerifyHint: { hasSeenReceiveVerifyHint: true },
      payCardBalance: { balanceFilter: "ethereum/erc20/usd__coin" },
      payCardLoginIntro: { hasSeenLoginIntro: true },
      payCardOnboardingWidget: {
        hasCompletedOnboarding: true,
        analyticsCardId: null,
        reportedAnalyticsMilestones: [],
        hasReadCardAccount: false,
      },
    } as unknown as State;

    const projected = payCardPersistedSelector(state);

    expect(projected).toEqual({
      hasSeenFeatureTour: true,
      hasSeenReceiveVerifyHint: true,
      balanceFilter: "ethereum/erc20/usd__coin",
      hasSeenLoginIntro: true,
      hasCompletedOnboarding: true,
      analyticsCardId: null,
      reportedAnalyticsMilestones: [],
      hasReadCardAccount: false,
    });
  });
});

describe("payCardDbSaveSliceSelector (mobile save trigger)", () => {
  const base = {
    payCardFeatureTour: { hasSeenFeatureTour: false },
    payRequestVerifyHint: { hasSeenReceiveVerifyHint: false },
    payCardBalance: { balanceFilter: "all" },
    payCardLoginIntro: { hasSeenLoginIntro: false },
    payCardOnboardingWidget: { hasCompletedOnboarding: false },
  } as unknown as State;

  it("holds its identity while no pay card slice changes", () => {
    expect(payCardDbSaveSliceSelector(base)).toBe(payCardDbSaveSliceSelector(base));
  });

  it.each([
    "payCardFeatureTour",
    "payRequestVerifyHint",
    "payCardBalance",
    "payCardLoginIntro",
    "payCardOnboardingWidget",
  ] as const)("re-triggers the save when only %s changes", slice => {
    const next = { ...base, [slice]: {} } as unknown as State;

    expect(payCardDbSaveSliceSelector(next)).not.toBe(payCardDbSaveSliceSelector(base));
  });
});
