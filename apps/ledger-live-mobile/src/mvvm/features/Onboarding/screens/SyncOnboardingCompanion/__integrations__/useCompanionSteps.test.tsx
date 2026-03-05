import React from "react";
import { act, renderHook } from "@tests/test-renderer";
import useCompanionSteps from "../hooks/useCompanionSteps";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { FirstStepCompanionStepKey } from "~/screens/SyncOnboarding/TwoStepStepper/types";
import { SeedOriginType } from "@ledgerhq/types-live";
import { State } from "~/reducers/types";
import { INITIAL_STATE } from "~/reducers/settings";

describe("useCompanionSteps", () => {
  it("when ledger sync step is not active should return correct state ", () => {
    const ref = React.createRef() as React.RefObject<SeedOriginType | undefined>;

    const { result } = renderHook(() =>
      useCompanionSteps({
        device: {
          deviceId: "mock_stax",
          deviceName: "Mock Stax",
          modelId: DeviceModelId.stax,
          wired: false,
        },
        productName: "Mock Stax",
        seedPathStatus: "new_seed",
        deviceOnboardingState: null,
        analyticsSeedConfiguration: ref,
      }),
    );

    expect(result.current.steps).toHaveLength(3);
    expect(result.current.hasSyncStep).toBe(false);
    expect(result.current.isLedgerSyncActive).toBe(false);

    expect(result.current.activeStep).toBe(FirstStepCompanionStepKey.EarlySecurityCheckCompleted);
    expect(
      result.current.steps.find(
        item => item.key === FirstStepCompanionStepKey.EarlySecurityCheckCompleted,
      )?.status,
    ).toBe("active");
    expect(result.current.steps.filter(({ status }) => status === "inactive")).toHaveLength(2);

    act(() => result.current.setStep(FirstStepCompanionStepKey.Pin));
    expect(result.current.activeStep).toBe(FirstStepCompanionStepKey.Pin);
    expect(
      result.current.steps.find(item => item.key === FirstStepCompanionStepKey.Pin)?.status,
    ).toBe("active");

    act(() => result.current.setStep(FirstStepCompanionStepKey.Seed));
    expect(result.current.activeStep).toBe(FirstStepCompanionStepKey.Seed);
    expect(
      result.current.steps.find(item => item.key === FirstStepCompanionStepKey.Seed)?.status,
    ).toBe("active");
  });

  it("when ledger sync step is active and has not synced before should return correct state ", () => {
    const ref = React.createRef() as React.RefObject<SeedOriginType | undefined>;

    const overrideInitialStateWithFeatureFlag = (state: State): State => ({
      ...state,
      settings: {
        ...INITIAL_STATE,
        ...state.settings,
        overriddenFeatureFlags: {
          llmOnboardingEnableSync: {
            enabled: true,
            params: {
              touchscreens: true,
            },
          },
        },
      },
    });

    const { result } = renderHook(
      () =>
        useCompanionSteps({
          device: {
            deviceId: "mock_stax",
            deviceName: "Mock Stax",
            modelId: DeviceModelId.stax,
            wired: false,
          },
          productName: "Mock Stax",
          seedPathStatus: "new_seed",
          deviceOnboardingState: null,
          analyticsSeedConfiguration: ref,
        }),
      {
        overrideInitialState: overrideInitialStateWithFeatureFlag,
      },
    );

    expect(result.current.steps).toHaveLength(4);
    expect(result.current.hasSyncStep).toBe(true);
    expect(result.current.isLedgerSyncActive).toBe(false);

    expect(result.current.activeStep).toBe(FirstStepCompanionStepKey.EarlySecurityCheckCompleted);
    expect(
      result.current.steps.find(
        item => item.key === FirstStepCompanionStepKey.EarlySecurityCheckCompleted,
      )?.status,
    ).toBe("active");

    act(() => result.current.setStep(FirstStepCompanionStepKey.Pin));
    expect(result.current.activeStep).toBe(FirstStepCompanionStepKey.Pin);
    expect(
      result.current.steps.find(item => item.key === FirstStepCompanionStepKey.Pin)?.status,
    ).toBe("active");

    act(() => result.current.setStep(FirstStepCompanionStepKey.Seed));
    expect(result.current.activeStep).toBe(FirstStepCompanionStepKey.Seed);
    expect(
      result.current.steps.find(item => item.key === FirstStepCompanionStepKey.Seed)?.status,
    ).toBe("active");

    act(() => result.current.setStep(FirstStepCompanionStepKey.Sync));
    expect(result.current.activeStep).toBe(FirstStepCompanionStepKey.Sync);
    expect(
      result.current.steps.find(item => item.key === FirstStepCompanionStepKey.Sync)?.status,
    ).toBe("active");
  });
});
