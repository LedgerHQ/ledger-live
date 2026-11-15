import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import { render, userEvent } from "@tests/test-renderer";
import type { ReactTestInstance } from "react-test-renderer";
import type { State } from "~/reducers/types";
import { SyncOnboarding } from "./index";

jest.mock("@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling", () => ({
  useOnboardingStatePolling: () => polling,
}));

jest.mock("@ledgerhq/live-common/deviceSDK/hooks/useToggleOnboardingEarlyChecks", () => ({
  useToggleOnboardingEarlyCheck: () => ({ state: { toggleStatus: "none" } }),
}));

jest.mock("./EarlySecurityCheck", () => ({ EarlySecurityCheck: () => null }));

jest.mock("./EarlySecurityCheckMandatoryDrawer", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: ({ isOpen, onCancel }: { isOpen?: boolean; onCancel?: () => void }) =>
      isOpen
        ? React.createElement(
            Pressable,
            { testID: "cancel-checks", onPress: onCancel },
            React.createElement(Text, null, "Cancel Checks"),
          )
        : null,
  };
});

jest.mock(
  "LLM/features/Onboarding/screens/SyncOnboardingCompanion/components/TwoStepSyncOnboardingCompanion",
  () => ({ __esModule: true, default: () => null }),
);

const device = {
  deviceId: "device-id",
  deviceName: "Ledger Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

let polling: {
  onboardingState: { currentOnboardingStep: OnboardingStep; isOnboarded: boolean } | null;
  allowedError: null;
  fatalError: null;
  resetStates: () => void;
  lockedDevice: false;
};

const idlePolling = {
  onboardingState: null,
  allowedError: null,
  fatalError: null,
  resetStates: () => undefined,
  lockedDevice: false as const,
};

function renderScreen({
  backReturnsToPrevious,
  hasCompletedOnboarding = false,
}: {
  backReturnsToPrevious?: boolean;
  hasCompletedOnboarding?: boolean;
}) {
  const parentGoBack = jest.fn();
  const navigation = {
    setOptions: jest.fn(),
    popToTop: jest.fn(),
    goBack: jest.fn(),
    getParent: () => ({ goBack: parentGoBack }),
  };
  const view = render(
    <SyncOnboarding
      navigation={navigation as never}
      route={
        {
          key: "sync",
          name: "SyncOnboardingCompanion",
          params: { device, backReturnsToPrevious },
        } as never
      }
    />,
    {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: { ...state.settings, hasCompletedOnboarding },
      }),
    },
  );

  return { navigation, parentGoBack, view };
}

async function cancelChecks(view: { findByTestId: (id: string) => Promise<ReactTestInstance> }) {
  let current: ReactTestInstance | null = await view.findByTestId("cancel-checks");
  while (current && typeof current.props.onPress !== "function") {
    current = current.parent;
  }
  current?.props.onPress();
}

async function pressHeaderBack(navigation: { setOptions: jest.Mock }) {
  const header = navigation.setOptions.mock.calls.at(-1)?.[0].header as () => React.ReactElement;
  const headerView = render(header());
  await userEvent.press(headerView.getByTestId("navigation-header-back-button"));
}

describe("SyncOnboarding back", () => {
  beforeEach(() => {
    polling = idlePolling;
  });

  it("should return to the previous screen when the fallback opened the checks", async () => {
    const { navigation, parentGoBack } = renderScreen({ backReturnsToPrevious: true });

    await pressHeaderBack(navigation);

    expect(parentGoBack).toHaveBeenCalledTimes(1);
    expect(navigation.popToTop).not.toHaveBeenCalled();
  });

  it("should keep the setup exit when the checks were not opened above a previous screen", async () => {
    const { navigation, parentGoBack } = renderScreen({
      backReturnsToPrevious: false,
      hasCompletedOnboarding: true,
    });

    await pressHeaderBack(navigation);

    expect(parentGoBack).not.toHaveBeenCalled();
    expect(navigation.popToTop).toHaveBeenCalledTimes(1);
  });

  it("should return to the previous screen when the genuine check is cancelled", async () => {
    polling = {
      ...idlePolling,
      onboardingState: {
        currentOnboardingStep: OnboardingStep.OnboardingEarlyCheck,
        isOnboarded: false,
      },
    };
    const { navigation, parentGoBack, view } = renderScreen({ backReturnsToPrevious: true });

    await pressHeaderBack(navigation);
    await cancelChecks(view);

    expect(parentGoBack).toHaveBeenCalledTimes(1);
    expect(navigation.popToTop).not.toHaveBeenCalled();
  });

  it("should leave the checks when the genuine check is cancelled from setup", async () => {
    polling = {
      ...idlePolling,
      onboardingState: {
        currentOnboardingStep: OnboardingStep.OnboardingEarlyCheck,
        isOnboarded: false,
      },
    };
    const { navigation, parentGoBack, view } = renderScreen({ backReturnsToPrevious: false });

    await pressHeaderBack(navigation);
    await cancelChecks(view);

    expect(parentGoBack).not.toHaveBeenCalled();
    expect(navigation.popToTop).toHaveBeenCalledTimes(1);
  });
});
