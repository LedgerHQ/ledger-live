import React from "react";
import { act, renderHook } from "tests/testSetup";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import useSyncOnboardingCompanionViewModel from "../useSyncOnboardingCompanionViewModel";
import { createRef } from "react";

import * as UseOnboardingStatePolling from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { SeedPhraseType } from "@ledgerhq/types-live";
import useCompanionSteps, { Step, StepKey, StepStatus } from "../hooks/useCompanionSteps";
import { Flex } from "@ledgerhq/react-ui/index";

jest.mock("~/renderer/hooks/useRecoverRestoreOnboarding", () => ({
  useRecoverRestoreOnboarding: jest.fn(),
}));
jest.mock("../hooks/useCompanionSteps", () => ({
  __esModule: true,
  ...jest.requireActual("../hooks/useCompanionSteps"),
  default: jest.fn(),
}));

const mockDevice: Device = {
  deviceId: "test-device",
  modelId: DeviceModelId.stax,
  wired: true,
};

const InactiveStep: StepStatus = "inactive";

const mockOnboardingState = {
  // Device not yet onboarded otherwise
  isOnboarded: false,
  // In normal mode otherwise
  isInRecoveryMode: false,

  seedPhraseType: SeedPhraseType.TwentyFour,

  currentOnboardingStep: OnboardingStep.WelcomeScreen1,
  currentSeedWordIndex: 0,
  charonSupported: true,
  charonStatus: null,
};

const hookState = {
  minimal: false,
  initialState: {
    settings: {
      overriddenFeatureFlags: {
        lldSyncOnboardingIncr1: {
          enabled: true,
        },
      },
    },
  },
};

const getMockSteps = (isTwoStep: boolean, hasSync: boolean): Step[] => {
  const steps = [
    {
      key: StepKey.Paired,
      status: InactiveStep,
      title: "Step 1",
      renderBody: () => <Flex data-testid="step-1" />,
    },
    {
      key: StepKey.Pin,
      status: InactiveStep,
      title: "Step 2",
      renderBody: () => <Flex data-testid="step-2" />,
    },
    {
      key: StepKey.Seed,
      status: InactiveStep,
      title: "Step 3",
      renderBody: () => <Flex data-testid="step-3" />,
    },
  ];
  if (isTwoStep) {
    if (hasSync) {
      steps.push({
        key: StepKey.Sync,
        status: InactiveStep,
        title: "Step 4",
        renderBody: () => <Flex data-testid="step-4" />,
      });
    }
    return steps;
  }

  steps.push(
    {
      key: StepKey.Apps,
      status: InactiveStep,
      title: "Step 4",
      renderBody: () => <Flex data-testid="step-4" />,
    },
    {
      key: StepKey.Ready,
      status: InactiveStep,
      title: "Step 5",
      renderBody: () => <Flex data-testid="step-5" />,
    },
  );

  return steps;
};

describe("useSyncOnboardingCompanionViewModel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return correct amount of steps when single timeline version", () => {
    jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
      onboardingState: mockOnboardingState,
      allowedError: null,
      lockedDevice: false,
      fatalError: null,
      resetStates: jest.fn(),
    });

    const defaultSteps = getMockSteps(false, false);
    jest.mocked(useCompanionSteps).mockReturnValue({
      defaultSteps,
      hasSyncStep: false,
      installStep: <Flex />,
      handleAppStepComplete: jest.fn(),
      isLedgerSyncActive: false,
    });

    const { result } = renderHook(
      () =>
        useSyncOnboardingCompanionViewModel({
          device: mockDevice,
          onLostDevice: jest.fn(),
          notifySyncOnboardingShouldReset: jest.fn(),
          parentRef: createRef(),
          setCompanionStep: jest.fn(),
        }),
      {
        minimal: false,
      },
    );

    expect(result.current.isDesyncOverlayOpen).toBe(false);
    expect(result.current.desyncOverlayDelay).toBe(1000);
    expect(result.current.productName).toBe("Ledger Stax");
    expect(result.current.isSyncIncr1Enabled).toBe(false);
    expect(result.current.deviceName).toBe("Ledger Stax");
    expect(result.current.steps).toHaveLength(5);
    expect(result.current.stepKey).toBe(StepKey.Paired);
    expect(result.current.analyticsSeedConfiguration.current).toBeUndefined();
    expect(result.current.isNewSeed).toBe(false);
  });

  describe("Two step sync companion", () => {
    it("should return correct amount of steps when two step version", () => {
      jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
        onboardingState: mockOnboardingState,
        allowedError: null,
        lockedDevice: false,
        fatalError: null,
        resetStates: jest.fn(),
      });

      const defaultSteps = getMockSteps(true, false);
      jest.mocked(useCompanionSteps).mockReturnValue({
        defaultSteps,
        hasSyncStep: false,
        installStep: <Flex />,
        handleAppStepComplete: jest.fn(),
        isLedgerSyncActive: false,
      });

      const { result } = renderHook(
        () =>
          useSyncOnboardingCompanionViewModel({
            device: mockDevice,
            onLostDevice: jest.fn(),
            notifySyncOnboardingShouldReset: jest.fn(),
            parentRef: createRef(),
            setCompanionStep: jest.fn(),
          }),
        hookState,
      );

      expect(result.current.isDesyncOverlayOpen).toBe(false);
      expect(result.current.desyncOverlayDelay).toBe(1000);
      expect(result.current.productName).toBe("Ledger Stax");
      expect(result.current.isSyncIncr1Enabled).toBe(true);
      expect(result.current.deviceName).toBe("Ledger Stax");
      expect(result.current.steps).toHaveLength(3);
      expect(result.current.stepKey).toBe(StepKey.Paired);
      expect(result.current.analyticsSeedConfiguration.current).toBeUndefined();
      expect(result.current.isNewSeed).toBe(false);
    });

    it("should return correct amount of steps when sync enabled and not activated", () => {
      jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
        onboardingState: mockOnboardingState,
        allowedError: null,
        lockedDevice: false,
        fatalError: null,
        resetStates: jest.fn(),
      });

      const defaultSteps = getMockSteps(true, true);
      jest.mocked(useCompanionSteps).mockReturnValue({
        defaultSteps,
        hasSyncStep: true,
        installStep: <Flex />,
        handleAppStepComplete: jest.fn(),
        isLedgerSyncActive: false,
      });

      const { result } = renderHook(
        () =>
          useSyncOnboardingCompanionViewModel({
            device: mockDevice,
            onLostDevice: jest.fn(),
            notifySyncOnboardingShouldReset: jest.fn(),
            parentRef: createRef(),
            setCompanionStep: jest.fn(),
          }),
        hookState,
      );
      expect(result.current.steps).toHaveLength(4);
    });

    it("should set correct state when on device Pin screen", () => {
      jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
        onboardingState: {
          ...mockOnboardingState,

          currentOnboardingStep: OnboardingStep.Pin,
        },
        allowedError: null,
        lockedDevice: false,
        fatalError: null,
        resetStates: jest.fn(),
      });

      const defaultSteps = getMockSteps(true, true);
      jest.mocked(useCompanionSteps).mockReturnValue({
        defaultSteps,
        hasSyncStep: true,
        installStep: <Flex />,
        handleAppStepComplete: jest.fn(),
        isLedgerSyncActive: false,
      });

      const { result } = renderHook(
        () =>
          useSyncOnboardingCompanionViewModel({
            device: mockDevice,
            onLostDevice: jest.fn(),
            notifySyncOnboardingShouldReset: jest.fn(),
            parentRef: createRef(),
            setCompanionStep: jest.fn(),
          }),
        hookState,
      );

      expect(result.current.stepKey).toBe(StepKey.Pin);
      expect(result.current.isNewSeed).toBe(false);
      expect(result.current.analyticsSeedConfiguration.current).toBeUndefined();
      expect(result.current.steps.findIndex(step => step.status === "active")).toBe(1);
    });

    it("should set correct state when on device SetupChoice screen", () => {
      jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
        onboardingState: {
          ...mockOnboardingState,

          currentOnboardingStep: OnboardingStep.SetupChoice,
        },
        allowedError: null,
        lockedDevice: false,
        fatalError: null,
        resetStates: jest.fn(),
      });

      const defaultSteps = getMockSteps(true, true);
      jest.mocked(useCompanionSteps).mockReturnValue({
        defaultSteps,
        hasSyncStep: true,
        installStep: <Flex />,
        handleAppStepComplete: jest.fn(),
        isLedgerSyncActive: false,
      });

      const { result } = renderHook(
        () =>
          useSyncOnboardingCompanionViewModel({
            device: mockDevice,
            onLostDevice: jest.fn(),
            notifySyncOnboardingShouldReset: jest.fn(),
            parentRef: createRef(),
            setCompanionStep: jest.fn(),
          }),
        hookState,
      );

      expect(result.current.stepKey).toBe(StepKey.Seed);
      expect(result.current.isNewSeed).toBe(false);
      expect(result.current.analyticsSeedConfiguration.current).toBeUndefined();
      expect(result.current.steps.findIndex(step => step.status === "active")).toBe(2);
    });

    it("should set correct state when on device NewDevice screen", () => {
      jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
        onboardingState: {
          ...mockOnboardingState,

          currentOnboardingStep: OnboardingStep.NewDevice,
        },
        allowedError: null,
        lockedDevice: false,
        fatalError: null,
        resetStates: jest.fn(),
      });

      const defaultSteps = getMockSteps(true, true);
      jest.mocked(useCompanionSteps).mockReturnValue({
        defaultSteps,
        hasSyncStep: true,
        installStep: <Flex />,
        handleAppStepComplete: jest.fn(),
        isLedgerSyncActive: false,
      });

      const { result } = renderHook(
        () =>
          useSyncOnboardingCompanionViewModel({
            device: mockDevice,
            onLostDevice: jest.fn(),
            notifySyncOnboardingShouldReset: jest.fn(),
            parentRef: createRef(),
            setCompanionStep: jest.fn(),
          }),
        hookState,
      );

      expect(result.current.stepKey).toBe(StepKey.Seed);
      expect(result.current.isNewSeed).toBe(true);
      expect(result.current.analyticsSeedConfiguration.current).toBe("new_seed");
      expect(result.current.steps.findIndex(step => step.status === "active")).toBe(2);
    });

    it("should set correct state when on device SetupChoiceRestore screen", () => {
      jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
        onboardingState: {
          ...mockOnboardingState,

          currentOnboardingStep: OnboardingStep.SetupChoiceRestore,
        },
        allowedError: null,
        lockedDevice: false,
        fatalError: null,
        resetStates: jest.fn(),
      });

      const defaultSteps = getMockSteps(true, true);
      jest.mocked(useCompanionSteps).mockReturnValue({
        defaultSteps,
        hasSyncStep: true,
        installStep: <Flex />,
        handleAppStepComplete: jest.fn(),
        isLedgerSyncActive: false,
      });

      const { result } = renderHook(
        () =>
          useSyncOnboardingCompanionViewModel({
            device: mockDevice,
            onLostDevice: jest.fn(),
            notifySyncOnboardingShouldReset: jest.fn(),
            parentRef: createRef(),
            setCompanionStep: jest.fn(),
          }),
        hookState,
      );

      expect(result.current.stepKey).toBe(StepKey.Seed);
      expect(result.current.isNewSeed).toBe(false);
      expect(result.current.analyticsSeedConfiguration.current).toBeUndefined();
      expect(result.current.steps.findIndex(step => step.status === "active")).toBe(2);
    });

    it("should set correct state when on device RestoreSeed screen", () => {
      jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
        onboardingState: {
          ...mockOnboardingState,

          currentOnboardingStep: OnboardingStep.RestoreSeed,
        },
        allowedError: null,
        lockedDevice: false,
        fatalError: null,
        resetStates: jest.fn(),
      });

      const defaultSteps = getMockSteps(true, true);
      jest.mocked(useCompanionSteps).mockReturnValue({
        defaultSteps,
        hasSyncStep: true,
        installStep: <Flex />,
        handleAppStepComplete: jest.fn(),
        isLedgerSyncActive: false,
      });

      const { result } = renderHook(
        () =>
          useSyncOnboardingCompanionViewModel({
            device: mockDevice,
            onLostDevice: jest.fn(),
            notifySyncOnboardingShouldReset: jest.fn(),
            parentRef: createRef(),
            setCompanionStep: jest.fn(),
          }),
        hookState,
      );

      expect(result.current.stepKey).toBe(StepKey.Seed);
      expect(result.current.isNewSeed).toBe(false);
      expect(result.current.analyticsSeedConfiguration.current).toBe("restore_seed");
      expect(result.current.steps.findIndex(step => step.status === "active")).toBe(2);
    });

    it("should set correct state when on device RecoverRestore screen", () => {
      jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
        onboardingState: {
          ...mockOnboardingState,

          currentOnboardingStep: OnboardingStep.RecoverRestore,
        },
        allowedError: null,
        lockedDevice: false,
        fatalError: null,
        resetStates: jest.fn(),
      });

      const defaultSteps = getMockSteps(true, true);
      jest.mocked(useCompanionSteps).mockReturnValue({
        defaultSteps,
        hasSyncStep: true,
        installStep: <Flex />,
        handleAppStepComplete: jest.fn(),
        isLedgerSyncActive: false,
      });

      const { result } = renderHook(
        () =>
          useSyncOnboardingCompanionViewModel({
            device: mockDevice,
            onLostDevice: jest.fn(),
            notifySyncOnboardingShouldReset: jest.fn(),
            parentRef: createRef(),
            setCompanionStep: jest.fn(),
          }),
        hookState,
      );

      expect(result.current.stepKey).toBe(StepKey.Seed);
      expect(result.current.isNewSeed).toBe(false);
      expect(result.current.analyticsSeedConfiguration.current).toBe("recover_seed");
      expect(result.current.steps.findIndex(step => step.status === "active")).toBe(2);
    });

    it("should set correct state when on device BackupCharon screen", () => {
      jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
        onboardingState: {
          ...mockOnboardingState,

          currentOnboardingStep: OnboardingStep.BackupCharon,
        },
        allowedError: null,
        lockedDevice: false,
        fatalError: null,
        resetStates: jest.fn(),
      });

      const defaultSteps = getMockSteps(true, true);
      jest.mocked(useCompanionSteps).mockReturnValue({
        defaultSteps,
        hasSyncStep: true,
        installStep: <Flex />,
        handleAppStepComplete: jest.fn(),
        isLedgerSyncActive: false,
      });

      const { result } = renderHook(
        () =>
          useSyncOnboardingCompanionViewModel({
            device: mockDevice,
            onLostDevice: jest.fn(),
            notifySyncOnboardingShouldReset: jest.fn(),
            parentRef: createRef(),
            setCompanionStep: jest.fn(),
          }),
        hookState,
      );

      expect(result.current.stepKey).toBe(StepKey.Seed);
      expect(result.current.isNewSeed).toBe(false);
      expect(result.current.analyticsSeedConfiguration.current).toBeUndefined();
      expect(result.current.steps.findIndex(step => step.status === "active")).toBe(2);
    });

    it("should set correct state when on device RestoreCharon screen", () => {
      jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
        onboardingState: {
          ...mockOnboardingState,

          currentOnboardingStep: OnboardingStep.RestoreCharon,
        },
        allowedError: null,
        lockedDevice: false,
        fatalError: null,
        resetStates: jest.fn(),
      });

      const defaultSteps = getMockSteps(true, true);
      jest.mocked(useCompanionSteps).mockReturnValue({
        defaultSteps,
        hasSyncStep: true,
        installStep: <Flex />,
        handleAppStepComplete: jest.fn(),
        isLedgerSyncActive: false,
      });

      const { result } = renderHook(
        () =>
          useSyncOnboardingCompanionViewModel({
            device: mockDevice,
            onLostDevice: jest.fn(),
            notifySyncOnboardingShouldReset: jest.fn(),
            parentRef: createRef(),
            setCompanionStep: jest.fn(),
          }),
        hookState,
      );

      expect(result.current.stepKey).toBe(StepKey.Seed);
      expect(result.current.isNewSeed).toBe(false);
      expect(result.current.analyticsSeedConfiguration.current).toBe("restore_charon");
      expect(result.current.steps.findIndex(step => step.status === "active")).toBe(2);
    });

    describe("when device is onboarded", () => {
      it("should set sync step as active when sync step available", () => {
        jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
          onboardingState: {
            ...mockOnboardingState,
            isOnboarded: true,
            currentOnboardingStep: OnboardingStep.Ready,
          },
          allowedError: null,
          lockedDevice: false,
          fatalError: null,
          resetStates: jest.fn(),
        });

        const defaultSteps = getMockSteps(true, true);
        jest.mocked(useCompanionSteps).mockReturnValue({
          defaultSteps,
          hasSyncStep: true,
          installStep: <Flex />,
          handleAppStepComplete: jest.fn(),
          isLedgerSyncActive: false,
        });

        const { result } = renderHook(
          () =>
            useSyncOnboardingCompanionViewModel({
              device: mockDevice,
              onLostDevice: jest.fn(),
              notifySyncOnboardingShouldReset: jest.fn(),
              parentRef: createRef(),
              setCompanionStep: jest.fn(),
            }),
          hookState,
        );

        expect(result.current.stepKey).toBe(StepKey.Sync);
        expect(result.current.isNewSeed).toBe(false);
        expect(result.current.analyticsSeedConfiguration.current).toBeUndefined();
        expect(result.current.steps.findIndex(step => step.status === "active")).toBe(3);
      });

      it("should set success step when sync step not available", () => {
        jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
          onboardingState: {
            ...mockOnboardingState,
            isOnboarded: true,
            currentOnboardingStep: OnboardingStep.Ready,
          },
          allowedError: null,
          lockedDevice: false,
          fatalError: null,
          resetStates: jest.fn(),
        });

        const defaultSteps = getMockSteps(true, true);
        jest.mocked(useCompanionSteps).mockReturnValue({
          defaultSteps,
          hasSyncStep: false,
          installStep: <Flex />,
          handleAppStepComplete: jest.fn(),
          isLedgerSyncActive: false,
        });

        const { result } = renderHook(
          () =>
            useSyncOnboardingCompanionViewModel({
              device: mockDevice,
              onLostDevice: jest.fn(),
              notifySyncOnboardingShouldReset: jest.fn(),
              parentRef: createRef(),
              setCompanionStep: jest.fn(),
            }),
          hookState,
        );

        expect(result.current.stepKey).toBe(StepKey.Success);
        expect(result.current.isNewSeed).toBe(false);
        expect(result.current.analyticsSeedConfiguration.current).toBeUndefined();
        expect(result.current.steps.findIndex(step => step.status === "active")).toBe(-1);
      });

      it("should redirect to App step when on success step", async () => {
        jest.spyOn(UseOnboardingStatePolling, "useOnboardingStatePolling").mockReturnValue({
          onboardingState: {
            ...mockOnboardingState,
            isOnboarded: true,
            currentOnboardingStep: OnboardingStep.Ready,
          },
          allowedError: null,
          lockedDevice: false,
          fatalError: null,
          resetStates: jest.fn(),
        });

        const defaultSteps = getMockSteps(true, true);
        jest.mocked(useCompanionSteps).mockReturnValue({
          defaultSteps,
          hasSyncStep: false,
          installStep: <Flex />,
          handleAppStepComplete: jest.fn(),
          isLedgerSyncActive: false,
        });

        const { result } = renderHook(
          () =>
            useSyncOnboardingCompanionViewModel({
              device: mockDevice,
              onLostDevice: jest.fn(),
              notifySyncOnboardingShouldReset: jest.fn(),
              parentRef: createRef(),
              setCompanionStep: jest.fn(),
            }),
          hookState,
        );

        await act(async () => {
          jest.runOnlyPendingTimers();
        });

        expect(result.current.stepKey).toBe(StepKey.Apps);
        expect(result.current.isNewSeed).toBe(false);
        expect(result.current.analyticsSeedConfiguration.current).toBeUndefined();
        expect(result.current.steps.findIndex(step => step.status === "active")).toBe(-1);
      });
    });
  });
});
