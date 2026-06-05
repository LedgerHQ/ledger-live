import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { SeedPhraseType } from "@ledgerhq/types-live";
import {
  OnboardingStep,
  type OnboardingState,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { render, screen, act } from "@tests/test-renderer";
import TwoStepSyncOnboardingCompanion from "../components/TwoStepSyncOnboardingCompanion";
import type { TwoStepSyncOnboardingCompanionProps } from "../components/TwoStepSyncOnboardingCompanion/types";

// External device-communication dependency. The companion is driven by the onboarding-state
// polling, so we control its result per-test to simulate the device progressing without
// talking to a real device.
let mockPollingState: {
  onboardingState: OnboardingState | null;
  allowedError: Error | null;
  fatalError: Error | null;
};
jest.mock("@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling", () => ({
  useOnboardingStatePolling: () => mockPollingState,
}));

// Native side-effect hook backed by expo-keep-awake (ESM native module): stub it out.
jest.mock("~/hooks/useKeepScreenAwake", () => ({
  useKeepScreenAwake: jest.fn(),
}));

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    useTrack: () => jest.fn(),
  };
});

const onboardedState = (): OnboardingState => ({
  isOnboarded: true,
  isInRecoveryMode: false,
  seedPhraseType: SeedPhraseType.TwentyFour,
  currentOnboardingStep: OnboardingStep.Ready,
  currentSeedWordIndex: 0,
  charonSupported: false,
  charonStatus: null,
});

const baseProps = (): TwoStepSyncOnboardingCompanionProps => ({
  device: {
    deviceId: "mock_stax",
    deviceName: "Mock Stax",
    modelId: DeviceModelId.stax,
    wired: false,
  },
  navigation: {
    navigate: jest.fn(),
    addListener: jest.fn(),
    reset: jest.fn(),
  } as unknown as TwoStepSyncOnboardingCompanionProps["navigation"],
  onLostDevice: jest.fn(),
  onShouldHeaderBeOverlaid: jest.fn(),
  updateHeaderOverlayDelay: jest.fn(),
  notifyEarlySecurityCheckShouldReset: jest.fn(),
});

describe("TwoStepSyncOnboardingCompanion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPollingState = { onboardingState: null, allowedError: null, fatalError: null };
  });

  it("should render the companion title and the onboarding timeline", async () => {
    render(<TwoStepSyncOnboardingCompanion {...baseProps()} />);

    expect(await screen.findByText("Let’s get started")).toBeOnTheScreen();
    expect(await screen.findByText("Get your Ledger Stax ready")).toBeOnTheScreen();
    // The first-step timeline lists the device setup sub-steps.
    expect(await screen.findByText("Ledger Stax is genuine")).toBeOnTheScreen();
    expect(await screen.findByText("PIN")).toBeOnTheScreen();
    // The second step is present (collapsed) below the first one.
    expect(await screen.findByText("Secure your crypto")).toBeOnTheScreen();
  });

  it("should notify the parent when the device polling hits a fatal error", async () => {
    const props = baseProps();
    mockPollingState = {
      onboardingState: null,
      allowedError: null,
      fatalError: new Error("device disconnected"),
    };

    render(<TwoStepSyncOnboardingCompanion {...props} />);

    await screen.findByText("Let’s get started");
    expect(props.onLostDevice).toHaveBeenCalled();
  });

  it("should advance through the steps to the ready state once the device reports it is onboarded", async () => {
    mockPollingState = { onboardingState: onboardedState(), allowedError: null, fatalError: null };

    render(<TwoStepSyncOnboardingCompanion {...baseProps()} />);

    // The step machine advances on 400ms timers: EarlySecurityCheck -> Pin -> Seed -> Ready.
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(
      await screen.findByText("Your Ledger Stax is ready to secure your digital assets"),
    ).toBeOnTheScreen();
  });
});
