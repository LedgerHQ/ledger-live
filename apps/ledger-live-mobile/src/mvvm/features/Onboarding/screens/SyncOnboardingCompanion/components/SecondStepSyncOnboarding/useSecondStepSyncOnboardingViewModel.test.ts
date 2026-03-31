import type { RefObject } from "react";
import type { LayoutChangeEvent } from "react-native";

import { act, renderHook } from "@tests/test-renderer";
import { SeedOriginType } from "@ledgerhq/types-live";

import { COMPANION_STATE, SEED_STATE } from "~/screens/SyncOnboarding/TwoStepStepper/types";
import { useSecondStepSyncOnboardingViewModel } from "./useSecondStepSyncOnboardingViewModel";
import type { State } from "~/reducers/types";

const mockWithTiming = jest.fn((toValue: unknown, _config?: unknown) => toValue);

jest.mock("react-native-reanimated", () => {
  const actualReanimated = jest.requireActual("react-native-reanimated");

  return {
    ...actualReanimated,
    __esModule: true,
    useSharedValue: (init: unknown) => ({ value: init }),
    useAnimatedStyle: () => ({}),
    useDerivedValue: () => ({ value: 0 }),
    withTiming: (v: unknown, config?: unknown) => mockWithTiming(v, config),
  };
});

describe("useSecondStepSyncOnboardingViewModel", () => {
  const mockHandleDone = jest.fn();
  const mockAnalyticsSeedConfiguration: RefObject<SeedOriginType | undefined> = {
    current: "restore_seed",
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(
      () =>
        useSecondStepSyncOnboardingViewModel({
          companionStep: COMPANION_STATE.SETUP,
          handleDone: mockHandleDone,
          analyticsSeedConfiguration: mockAnalyticsSeedConfiguration,
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              deviceInitialApps: { enabled: true, params: { apps: ["Bitcoin", "Ethereum"] } },
            },
          },
        }),
      },
    );

    expect(result.current.isFinished).toBe(false);
    expect(result.current.initialAppsToInstall).toEqual(["Bitcoin", "Ethereum"]);
  });

  it("should use fallback apps when feature flag is not available", () => {
    const { result } = renderHook(
      () =>
        useSecondStepSyncOnboardingViewModel({
          companionStep: COMPANION_STATE.SETUP,
          handleDone: mockHandleDone,
          analyticsSeedConfiguration: mockAnalyticsSeedConfiguration,
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              deviceInitialApps: {
                enabled: false,
                params: { apps: ["Bitcoin"] },
              },
            },
          },
        }),
      },
    );

    expect(result.current.initialAppsToInstall).toEqual(["Bitcoin", "Ethereum", "Polygon"]);
  });

  it("should call handleDone immediately when exit with done=true and new_seed", () => {
    const analyticsSeed = { current: "new_seed" as SeedOriginType };

    const { result } = renderHook(
      () =>
        useSecondStepSyncOnboardingViewModel({
          companionStep: COMPANION_STATE.EXIT,
          handleDone: mockHandleDone,
          analyticsSeedConfiguration: analyticsSeed,
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              deviceInitialApps: { enabled: true, params: { apps: ["Bitcoin", "Ethereum"] } },
            },
          },
        }),
      },
    );

    act(() => {
      result.current.handleExit(true);
    });

    expect(mockHandleDone).toHaveBeenCalledWith(true);
  });

  it("should delay handleDone call when exit with done=true and existing_seed", () => {
    const analyticsSeed = { current: "restore_seed" as SeedOriginType };
    const { result } = renderHook(
      () =>
        useSecondStepSyncOnboardingViewModel({
          companionStep: COMPANION_STATE.EXIT,
          handleDone: mockHandleDone,
          analyticsSeedConfiguration: analyticsSeed,
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              deviceInitialApps: { enabled: true, params: { apps: ["Bitcoin", "Ethereum"] } },
            },
          },
        }),
      },
    );

    act(() => {
      result.current.handleExit(true);
    });

    expect(result.current.isFinished).toBe(true);
    expect(mockHandleDone).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(800);
    });

    expect(mockHandleDone).toHaveBeenCalledWith(true);
  });

  it("should call handleDone immediately when exit with done=false", () => {
    const { result } = renderHook(
      () =>
        useSecondStepSyncOnboardingViewModel({
          companionStep: COMPANION_STATE.EXIT,
          handleDone: mockHandleDone,
          analyticsSeedConfiguration: mockAnalyticsSeedConfiguration,
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              deviceInitialApps: { enabled: true, params: { apps: ["Bitcoin", "Ethereum"] } },
            },
          },
        }),
      },
    );

    act(() => {
      result.current.handleExit(false);
    });

    expect(mockHandleDone).toHaveBeenCalledWith(false);
  });

  it("should animate height on layout using withTiming", () => {
    const { result } = renderHook(
      () =>
        useSecondStepSyncOnboardingViewModel({
          companionStep: SEED_STATE.NEW_SEED,
          handleDone: mockHandleDone,
          analyticsSeedConfiguration: mockAnalyticsSeedConfiguration,
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              deviceInitialApps: { enabled: false, params: {} },
            },
          },
        }),
      },
    );

    const layoutEvent = {
      nativeEvent: { layout: { height: 123, width: 0, x: 0, y: 0 } },
    } as LayoutChangeEvent;

    act(() => {
      result.current.handleLayout(layoutEvent);
    });

    expect(mockWithTiming).toHaveBeenCalledWith(123, expect.objectContaining({ duration: 300 }));
  });

  it("should animate opacity to 0 on setup/exit and to 100 otherwise", () => {
    const commonOptions = {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          overriddenFeatureFlags: {
            deviceInitialApps: { enabled: false, params: {} },
          },
        },
      }),
    };

    renderHook(
      () =>
        useSecondStepSyncOnboardingViewModel({
          companionStep: COMPANION_STATE.SETUP,
          handleDone: mockHandleDone,
          analyticsSeedConfiguration: mockAnalyticsSeedConfiguration,
        }),
      commonOptions,
    );
    expect(mockWithTiming).toHaveBeenCalledWith(0, expect.objectContaining({ duration: 400 }));

    mockWithTiming.mockClear();
    renderHook(
      () =>
        useSecondStepSyncOnboardingViewModel({
          companionStep: SEED_STATE.NEW_SEED,
          handleDone: mockHandleDone,
          analyticsSeedConfiguration: mockAnalyticsSeedConfiguration,
        }),
      commonOptions,
    );
    expect(mockWithTiming).toHaveBeenCalledWith(100, expect.objectContaining({ duration: 400 }));

    mockWithTiming.mockClear();
    renderHook(
      () =>
        useSecondStepSyncOnboardingViewModel({
          companionStep: COMPANION_STATE.EXIT,
          handleDone: mockHandleDone,
          analyticsSeedConfiguration: mockAnalyticsSeedConfiguration,
        }),
      commonOptions,
    );
    expect(mockWithTiming).toHaveBeenCalledWith(0, expect.objectContaining({ duration: 400 }));
  });

  it("should return animated styles", () => {
    const { result } = renderHook(
      () =>
        useSecondStepSyncOnboardingViewModel({
          companionStep: COMPANION_STATE.SETUP,
          handleDone: mockHandleDone,
          analyticsSeedConfiguration: mockAnalyticsSeedConfiguration,
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              deviceInitialApps: { enabled: true, params: { apps: ["Bitcoin", "Ethereum"] } },
            },
          },
        }),
      },
    );

    expect(result.current.animatedStyle).toBeDefined();
    expect(result.current.animatedOpacityStyle).toBeDefined();
  });
});
